<?php
require __DIR__ . '/../../database.php';
require __DIR__ . '/../../comment-decoder.php';
require __DIR__ . '/../../notifications.php';

use function KrankWeb\CommentDecoder\decodeCommentFile;
use function KrankWeb\CommentDecoder\validateFile;
use function KrankWeb\Notifications\sendMessageToDiscordWebhook;

//error_log($_SERVER['CONTENT_TYPE']);

function handleAuthorization(callable $onError, string $validSecret)
{
    $isAuthorized = isset($_POST['secret']) && $_POST['secret'] === $validSecret;
    if ($isAuthorized) return true;
    $onError(403, "Unauthorized");
    return false;
}

function getImage(callable $onError)
{
    // TODO: We could use ImageMagick instead of libgd (GD library) to add metadata,
    //   but for simplicities sake we will refrain from using it for now.
    // TODO: As of now, any valid PNG will be accepted and copied without transparency.
    //   A more robust approach would be to rebuild the brush engine and replay the brush history.
    //   But in any case, we still need to review all comments in case someone decides to upload inappropriate art.

    // Decode image
    $imageData = $_POST['image'];
    $imageData = str_replace('data:image/png;base64,', '', $imageData);
    $imageData = str_replace(' ', '+', $imageData);
    $decodedData = base64_decode($imageData);

    if ($decodedData === false) {
        $onError(400, 'Failed to decode image');
        return null;
    }

    // Create GD image from string
    $srcImage = @imagecreatefromstring($decodedData); // We suppress bc we have error logging below
    if (!$srcImage) {
        $onError(400, 'Failed to create image from data.');
        return null;
    }

    // We copy the image for security reasons, so no hidden data blocks are sneaked into the PNG.
    return copyImage($srcImage);
}

function checkMissingArguments(callable $onError, array $requiredArguments)
{
    // Check if required arguments are set
    $missingArguments = [];
    foreach ($requiredArguments as $argument) {
        $isNestedArg = gettype($argument) === "array";
        $argType = $isNestedArg ? ($argument["type"] ?? "post") : "post";
        $argName = $isNestedArg ? $argument["name"] : $argument;
        switch ($argType) {
            case "post":
                if (!isset($_POST[$argName]) || strlen($_POST[$argName]) < 1)
                    array_push($missingArguments, $argName);
                continue 2;
            case "file":
                if (!isset($_FILES[$argName]) || $_FILES[$argName]['error'] !== UPLOAD_ERR_OK)
                    array_push($missingArguments, $argName);
                continue 2;
            default:
                throw new Error("Unknown argument type '$argType'");
        }
    }
    if (count($missingArguments) > 0) {
        $onError(400, 'Missing arguments: ' . implode(", ", $missingArguments));
        return false;
    }
    return true;
}

function copyImage($srcImage)
{
    $width = imagesx($srcImage);
    $height = imagesy($srcImage);
    $newImageData = imagecreatetruecolor($width, $height);
    for ($y = 0; $y < $height; $y++) {
        for ($x = 0; $x < $width; $x++) {
            $color = imagecolorat($srcImage, $x, $y);
            imagesetpixel($newImageData, $x, $y, $color);
        }
    }
    ob_start();
    imagepng($newImageData);
    $newImage = ob_get_clean();
    imagedestroy($newImageData);
    return $newImage;
}

function sanitizeText(callable $onError, string $text, array $options = [])
{
    $minLength = $options['minLength'] ?? 0;
    $maxLength = $options['maxLength'] ?? 255;
    $varName = $options['varName'] ?? 'variable';
    $format = $options['format'] ?? 'all';
    switch ($format) {
        case "all":
            break; // Do nothing
        case "number":
            if (!ctype_digit($text));
            $onError(400, "$varName has to be all digits");
            return null;
        default:
            throw new \InvalidArgumentException("Unknown string format: $format");
    }
    $sanitizedText = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
    // Normalization is important, bc otherwise some strings look the same but have different lengths.
    // We use the encoding utf8mb4 for our database, which is the default of PHP 'UTF-8'.
    $normalizedText = \Normalizer::normalize($sanitizedText, \Normalizer::FORM_C); // requires 'intl' extension
    $length = mb_strlen($normalizedText, 'UTF-8'); // multibyte characters are counted as 1
    if ($length < $minLength) {
        $onError(400, "$varName is not long enough (min $minLength)");
        return null;
    }
    if ($length > $maxLength) {
        $onError(400, "$varName is too long (max $maxLength)");
        return null;
    }
    return $normalizedText;
}

function onError($code, $message, $internalMessage = null)
{
    // TODO: Save failed request in log, so data could be retrieved
    //  It would be sad if someone spends considerable time drawing, only for the upload to fail and their data just being lost.
    //  We do not want to backup files tho if authorization failed, otherwise webcrawlers and others might spam the log; or check for GET
    error_log("$code $message" . $internalMessage ? " $internalMessage" : "");
    http_response_code($code);
    exit($message);
}

function getUniqueHash(callable $onError, $pdo, $tableName)
{
    try {
        $hash = getUniqueSecretFromDatabase($pdo, $tableName, "hash");
    } catch (PDOException $e) {
        $onError(500, 'Database error', $e->getMessage());
        return null;
        //$millis = round(microtime(true) * 1000);
        //$errorPath_without_hash = $errorDir . "comment_$millis.png";
        //file_put_contents($errorPath_without_hash, $decodedData);
        //exit('Database error: ' . $e->getMessage());
    }
    return $hash;
}

function getHistory(callable $onError, array $constraints = [])
{
    $historyFile = $_FILES['history']['tmp_name'];
    $decodedCommentHistory = decodeCommentFile($historyFile);
    $validation = validateFile($decodedCommentHistory, [
        'maxWidth' => $constraints['maxWidth'] ?? null,
        'maxHeight' => $constraints['maxHeight'] ?? null,
    ]);
    if ($validation !== true) {
        $onError(400, "Invalid history file", implode(", ", $validation));
        return null;
    }
    return $historyFile;
}

function storeFailedUpload($logFile, array $options)
{
    $payload = $options['payload'];
    $image = $payload['image'];
    $history = $payload['history'];
    unset($payload['image']);
    unset($payload['history']);

    $timestamp = $options['timestamp'];
    $imagePathError = $options['imagePathError'];
    $historyPathError = $options['historyPathError'];

    $text = $timestamp . " " . json_encode($payload);
    if (file_put_contents($logFile, $text, FILE_APPEND) === false)
        // If we fail in the recovery then there is no point to recover, just throw Exception
        throw new Exception("Failed on fallback (logging error) " . $text);
    if (file_put_contents($imagePathError, $image) === false)
        throw new Exception("Failed on fallback (saving image) " . $text);
}

function storeComment(callable $onError, array $storage, array $fields)
{
    $pdo = $storage['pdo'];
    $tableName = $storage['tableName'];

    $username = $fields['username'];
    $website = $fields['website'];
    $target = $fields['target'];
    $hash = $fields['hash'];
    $image = $fields['image'];
    $history = $fields['history'];
    $imagePath = $fields['imagePath'];
    $historyPath = $fields['historyPath'];
    $submissionId = $fields['submissionId'];

    // Persisting data (1. image, 2. history, 3. DB record)
    if (file_put_contents($imagePath, $image) === false) {
        $onError(500, 'Could not save image on server', error_get_last());
        return false;
    }
    if (move_uploaded_file($history, $historyPath) === false) {
        $onError(500, 'Could not save history on server', error_get_last());
        unlink($imagePath); // Rewind upload because we were not successful; ironically we will not handle unlink failing
        return false;
    }
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO $tableName (created, imagePath, historyPath, target, approved, username, website, hash, submissionId) " .
                "VALUES (NOW(), ?, ?, ?, NULL, ?, ?, ?, ?)"
        );
        $stmt->execute([$imagePath, $historyPath, $target, $username, $website ?? '', $hash, $submissionId]);
    } catch (PDOException $e) {
        unlink($imagePath);
        unlink($historyPath);
        $onError(500, 'Database error', $e->getMessage());
        return false;
    }
    return true;
}

function mpreg(string $url) {
    return preg_replace('/[^a-z0-9\/-]/', '', $url);
}

function handleRequest($pdo, $tableName, $validSecret, $maxWidth, $maxHeight, $uploadDir, $errorDir, array $webhookOpts = [])
{
    $minorErrors = []; // minor error = validation fails; major error = failure saving, parsing, etc.
    $onMinorError = fn($code, $message, $internalMessage = null) => $minorErrors[] = [$code, $message, $internalMessage];
    //$onMajorError = fn()

    handleAuthorization('onError', $validSecret);
    checkMissingArguments('onError', [
        "secret", 
        "target", 
        "username", 
        "image", 
        "submissionId", 
        ["name" => "history", "type" => "file"],
    ]);
    $image = getImage('onError');
    $history = getHistory('onError', [
        'maxWidth' => $maxWidth,
        'maxHeight' => $maxHeight,
    ]);
    $hash = getUniqueHash('onError', $pdo, $tableName);
    $username = sanitizeText($onMinorError, $_POST['username'], [
        'varName' => 'username',
        'maxLength' => 100,
    ]);
    $website = sanitizeText($onMinorError, $_POST['website'], ['varName' => 'website']);
    $target = sanitizeText($onMinorError, $_POST['target'], ['varName' => 'target']);
    // Since $target will actually be sent out as a notification via a Discord webhook, we will need to do some extra
    // sanitation so no malicious URL can be sent out in the Discord message.
    $target = mpreg($target);
    $submissionId = sanitizeText($onMinorError, $_POST['submissionId'], [
        'varName' => 'submissionId',
        'minLength' => 10,
        'maxLength' => 10,
    ]);

    if (!file_exists($uploadDir))
        mkdir($uploadDir, 0755, true);
    if (!file_exists($errorDir))
        mkdir($errorDir, 0755, true);

    $imageName = "comment_$hash.png";
    $historyName = "comment_$hash.brsh"; // ".brsh" = brush history
    $imagePath = $uploadDir . $imageName;
    $historyPath = $uploadDir . $historyName;
    $imagePathError = $errorDir . $imageName;
    $historyPathError = $errorDir . $historyName;

    storeComment('onError', [
        'pdo' => $pdo,
        'tableName' => $tableName,
    ], [
        'username' => $username,
        'website' => $website,
        'target' => $target,
        'hash' => $hash,
        'image' => $image,
        'history' => $history,
        'imagePath' => $imagePath,
        'historyPath' => $historyPath,
        'submissionId' => $submissionId,
    ]);

    $webhookOpts = array_merge([
        'id' => null,
        'token' => null,
        'username' => null,
        'message' => null,
    ], $webhookOpts);
    if (isset($webhookOpts['id']) && isset($webhookOpts['token'])) {
        $notificationMessage = sprintf($webhookOpts['message'], $target);
        sendMessageToDiscordWebhook($webhookOpts['id'], $webhookOpts['token'], $webhookOpts['username'], $notificationMessage);
    }
}

// Configuration
$validSecret = 'mySecret';
$uploadDir = normalizePath(__DIR__ . '/../../uploads/');
$errorDir = normalizePath(__DIR__ .  "/../../uploads_failed/");
$rawPagePath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathname = preg_replace('/\.[a-zA-Z0-9]+$/', '', $rawPagePath); // We want to strip file endings like '.html'
$tableName = $config['comments_table'];

// TIMESTAMP in MariaDB is always stored as date UTC+0, so we need to set the server timezone before adding to DB
date_default_timezone_set('UTC');

handleRequest($pdo, $tableName, $validSecret, 320, 120, $uploadDir, $errorDir, webhookOpts: [
    'id' => getenv("COMMENTS_DISCORD_WEBHOOK_ID"),
    'token' => getenv("COMMENTS_DISCORD_WEBHOOK_TOKEN"),
    'username' => "Krankobot",
    'message' => "*🔔 A new comment was made on https://krank.love%s !*",
]);
echo 'Upload successful!';
