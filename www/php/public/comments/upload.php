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

function storeComment(callable $onError, array $storage, array $fields, array $rateLimitOptions)
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

function checkRateLimitingGlobal(callable $onError, $pdo, array $rateLimitOptions, array $adminWebhookOpts = []) {
    $requestTime = $rateLimitOptions['requestTime'];
    $settingsTableName = $rateLimitOptions['settingsTableName'];
    $globalLimit = $rateLimitOptions['globalLimit'];
    $globalInterval = $rateLimitOptions['globalInterval'];
    
    $timestampFormat = 'Y-m-d H:i:s';
    $globalExpiresAt = (clone $requestTime)->add($globalInterval)->format($timestampFormat);

    try {
        $stmt = $pdo->prepare("
        INSERT INTO $settingsTableName (
            id,
            comment_attempt_count,
            comment_attempt_limit_expires_at,
            last_comment_attempt_at
        )
        VALUES (
            1, 1, :comment_attempt_limit_expires_at, :now
        )
        ON DUPLICATE KEY UPDATE
            comment_attempt_count = 
                CASE WHEN comment_attempt_limit_expires_at < :now 
                THEN 1 
                ELSE comment_attempt_count + 1 END,
            comment_attempt_limit_expires_at = 
                CASE WHEN comment_attempt_limit_expires_at < :now 
                THEN :comment_attempt_limit_expires_at 
                ELSE comment_attempt_limit_expires_at END,
            last_comment_attempt_at = :now

        RETURNING
            comment_attempt_count, comment_attempt_limit_expires_at
        ;");
        $stmt->execute([
            ':comment_attempt_limit_expires_at' => $globalExpiresAt,
            ':now' => $requestTime->format($timestampFormat),
        ]);
        $results = $stmt->fetch(PDO::FETCH_ASSOC);
        $globalCount = (int) $results['comment_attempt_count'];
        $globalExpiresAt = getUTCFromSQLTimestamp($results['comment_attempt_limit_expires_at']);
        if ($globalCount <= $globalLimit) 
            return true;
        $remainingTimeAsString = formatTimeDistance($globalExpiresAt->getTimestamp());

        // Send an alert to a special maintenance Discord channel
        $webhookId = $adminWebhookOpts['id'] ?? null;
        $webhookToken = $adminWebhookOpts['token'] ?? null;
        $webhookUsername = $adminWebhookOpts['username'] ?? null;
        $webhookMessage = $adminWebhookOpts['message'] ?? null;
        if (isset($webhookId) && isset($webhookToken))
            sendMessageToDiscordWebhook($webhookId, $webhookToken, $webhookUsername, $webhookMessage);
        
        onError(429, "Too many comment requests on site, please wait $remainingTimeAsString.", 
            "Comment rate limit globally exceeded");
        return false;
    } catch (PDOException $e) {
        $onError(500, 'Database error', $e->getMessage());
        return false;
    }
}

function cleanupRateLimitTableByChance(callable $onError, $pdo, $tableName, $probabilityPerRequest) {
    $reciprocalProbability = (int) round(1 / $probabilityPerRequest);
    $statementLimit = $reciprocalProbability * 2;
    if (random_int(1, $reciprocalProbability) !== 1)
        return;
    try {
        /* 
        * This is a little imprecise. The burst, mid and long timers expire separately from each other. 
        * It could happen that the burst and mid timers are still in action (e.g. the client has to wait
        * 30 seconds or 10 minutes when the long timer has already expired (rollover from last day). 
        * So we shouldn't delete the rate limit in that case. But since this is not that common to occur
        * and we gain faster cleanup in this sneaky randomized request, we will simply ignore those cases
        * in favor of faster execution speed.
        */
        $pdo->exec("
            DELETE FROM $tableName
            WHERE long_expires_at < NOW()
            LIMIT $statementLimit;
        ");
    } catch (PDOException $e) {
        $onError(500, 'Database error', $e->getMessage());
    }
}

function getUTCFromSQLTimestamp($dateString): DateTime {
    return DateTime::createFromFormat('Y-m-d H:i:s', $dateString, new DateTimeZone('UTC'));
}

function formatTimeDistance(int $ts): string {
    $diff = max(0, $ts - time());
    $hours = intdiv($diff, 3600);
    $minutes = intdiv($diff % 3600, 60);
    $seconds = $diff % 60;
    $hUnit = $hours === 1 ? 'hour' : 'hours';
    $mUnit = $minutes === 1 ? 'minute' : 'minutes';
    $sUnit = $seconds === 1 ? 'second' : 'seconds';
    if ($diff >= 3600) return sprintf('%d %s %d %s', $hours, $hUnit, $minutes, $mUnit);
    if ($diff >= 60) return sprintf('%d %s %d %s', $minutes, $mUnit, $seconds, $sUnit);
    return sprintf('%d %s', $seconds, $sUnit);
}

function checkRateLimitingPerIP(callable $onError, $pdo, array $rateLimitOptions) {
    $requestKey = $rateLimitOptions['requestKey'];
    $requestTime = $rateLimitOptions['requestTime'];
    $rateLimitTableName = $rateLimitOptions['rateLimitTableName'];
    $burstLimit = $rateLimitOptions['burstLimit'];
    $burstInterval = $rateLimitOptions['burstInterval'];
    $midLimit = $rateLimitOptions['midLimit'];
    $midInterval = $rateLimitOptions['midInterval'];
    $longLimit = $rateLimitOptions['longLimit'];
    $longInterval = $rateLimitOptions['longInterval'];

    $timestampFormat = 'Y-m-d H:i:s';
    $burstExpiresAt = (clone $requestTime)->add($burstInterval)->format($timestampFormat);
    $midExpiresAt = (clone $requestTime)->add($midInterval)->format($timestampFormat);
    $longExpiresAt = (clone $requestTime)->add($longInterval)->format($timestampFormat);

    // if no record:
    //   create record, set counters to 1, set expiration fields, set limits
    // if record:
    //   if any expiration fields have expired:
    //     set according expired counters to 1
    //     set according expiration fields to now + interval
    //   if none expiration fields have expired:
    //     increment counters
    //     if any counter is larger than their according limit
    //       reject

    try {
        $stmt = $pdo->prepare("
        INSERT INTO $rateLimitTableName (
            key_hash,
            burst_count, burst_expires_at,
            mid_count,   mid_expires_at,
            long_count,  long_expires_at,
            last_seen
        )
        VALUES (
            :key_hash,
            1, :burst_expires_at,
            1, :mid_expires_at,
            1, :long_expires_at,
            :now
        )
        ON DUPLICATE KEY UPDATE
            burst_count      = CASE WHEN burst_expires_at < :now THEN 1                 ELSE burst_count + 1  END,
            burst_expires_at = CASE WHEN burst_expires_at < :now THEN :burst_expires_at ELSE burst_expires_at END,
            mid_count        = CASE WHEN mid_expires_at < :now   THEN 1                 ELSE mid_count + 1    END,
            mid_expires_at   = CASE WHEN mid_expires_at < :now   THEN :mid_expires_at   ELSE mid_expires_at   END,
            long_count       = CASE WHEN long_expires_at < :now  THEN 1                 ELSE long_count + 1   END,
            long_expires_at  = CASE WHEN long_expires_at < :now  THEN :long_expires_at  ELSE long_expires_at  END,
            last_seen = :now
    
        RETURNING
            burst_count,      mid_count,      long_count,
            burst_expires_at, mid_expires_at, long_expires_at
        ;");
        $stmt->execute([
            ':key_hash' => $requestKey,
            ':burst_expires_at' => $burstExpiresAt,
            ':mid_expires_at' => $midExpiresAt,
            ':long_expires_at' => $longExpiresAt,
            ':now' => $requestTime->format($timestampFormat),
        ]);
        $results = $stmt->fetch(PDO::FETCH_ASSOC);
        $burstCount = (int) $results['burst_count'];
        $midCount = (int) $results['mid_count'];
        $longCount = (int) $results['long_count'];
        $burstExpiresAt = getUTCFromSQLTimestamp($results['burst_expires_at']);
        $midExpiresAt = getUTCFromSQLTimestamp($results['mid_expires_at']);
        $longExpiresAt = getUTCFromSQLTimestamp($results['long_expires_at']);
        $relevantTimers = [];
        if ($longCount > $longLimit)   array_push($relevantTimers, $longExpiresAt->getTimestamp());
        if ($midCount > $midLimit)     array_push($relevantTimers, $midExpiresAt->getTimestamp());
        if ($burstCount > $burstLimit) array_push($relevantTimers, $burstExpiresAt->getTimestamp());
        if (count($relevantTimers) <= 0)
            return true;
        $biggestTimer = max($relevantTimers);
        $remainingTimeAsString = formatTimeDistance($biggestTimer);
        onError(429, "Too many comment requests, please wait $remainingTimeAsString.", "Comment rate limit per IP exceeded");
        return false;
    } catch (PDOException $e) {
        $onError(500, 'Database error', $e->getMessage());
        return false;
    }
}

function handleRequest(
    $pdo, $tableName, $validSecret, $maxWidth, $maxHeight, $uploadDir, $errorDir, 
    array $rateLimitOptions, array $pingWebhookOpts = [], array $adminWebhookOpts = []
) {
    global $config;
    $minorErrors = []; // minor error = validation fails; major error = failure saving, parsing, etc.
    $onMinorError = fn($code, $message, $internalMessage = null) => $minorErrors[] = [$code, $message, $internalMessage];
    //$onMajorError = fn()

    // The request can be rejected on pretty much any step by calling onError
    checkRateLimitingPerIP('onError', $pdo, $rateLimitOptions);
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

    $imageName = sprintf($config['commentsImageName'], $hash);
    $historyName = sprintf($config['commentsHistoryName'], $hash);
    $imagePath = $uploadDir . $imageName;
    $historyPath = $uploadDir . $historyName;
    $imagePathError = $errorDir . $imageName;
    $historyPathError = $errorDir . $historyName;

    /*
     * The global count works a bit different in that only successfully submitted comments are counted.
     * While the rate limiting per IP counts any successful + failed request, the global site limit is per actual
     * comments that *WOULD BE* saved in the database. This is to at least *limit* spam should it occur on this site. 
     * ... Boy I really hope that this simple rate limiter will work as intended.
     */
    checkRateLimitingGlobal('onError', $pdo, $rateLimitOptions, $adminWebhookOpts);
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
    ], $rateLimitOptions);
    cleanupRateLimitTableByChance('onError', $pdo, $rateLimitOptions['rateLimitTableName'], 0.01);

    $pingWebhookOpts = array_merge([
        'id' => null,
        'token' => null,
        'username' => null,
        'message' => null,
    ], $pingWebhookOpts);
    if (isset($pingWebhookOpts['id']) && isset($pingWebhookOpts['token'])) {
        $notificationMessage = sprintf($pingWebhookOpts['message'], $target, $hash);
        sendMessageToDiscordWebhook($pingWebhookOpts['id'], $pingWebhookOpts['token'], $pingWebhookOpts['username'], $notificationMessage);
    }
}

// Configuration
$validSecret = 'mySecret';
$uploadDir = $config['commentsUploadDir'];
$errorDir = $config['commentsErrorDir'];
$rawPagePath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathname = preg_replace('/\.[a-zA-Z0-9]+$/', '', $rawPagePath); // We want to strip file endings like '.html'
$tableName = $config['comments_table'];

// TIMESTAMP in MariaDB is always stored as date UTC+0, so we need to set the server timezone before adding to DB
date_default_timezone_set('UTC');
$rateLimitSecret = getEnv("COMMENTS_RATE_LIMIT_SECRET");
$requestIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$requestKey = hash_hmac('sha256', $requestIp, $rateLimitSecret, true);
handleRequest($pdo, $tableName, $validSecret, 320, 120, $uploadDir, $errorDir, rateLimitOptions: [
    'requestKey' => base64_encode($requestKey),
    'requestTime' => new DateTime('now'),
    'rateLimitTableName' => $config['comments_rate_limit_table'],
    'settingsTableName' => $config['comments_settings_table'],
    'burstLimit' => $config['comments_rate_limit_burst_count'],
    'burstInterval' => $config['comments_rate_limit_burst_window'],
    'midLimit' => $config['comments_rate_limit_mid_count'],
    'midInterval' => $config['comments_rate_limit_mid_window'],
    'longLimit' => $config['comments_rate_limit_long_count'],
    'longInterval' => $config['comments_rate_limit_long_window'],
    'globalLimit' => $config['comments_rate_limit_global_count'],
    'globalInterval' => $config['comments_rate_limit_global_window'],
], pingWebhookOpts: [
    'id' => getenv("COMMENTS_DISCORD_WEBHOOK_ID"),
    'token' => getenv("COMMENTS_DISCORD_WEBHOOK_TOKEN"),
    'username' => "Krankobot",
    'message' => '*🔔 A new comment was made on [krank.love%1$s](https://krank.love%1$s#comment-%2$s) !*',
], adminWebhookOpts: [
    'id' => getenv("ADMIN_DISCORD_WEBHOOK_ID"),
    'token' => getenv("ADMIN_DISCORD_WEBHOOK_TOKEN"),
    'username' => "Krankobot (Admin)",
    'message' => '*⚠️ Global comment rate limit on the site has been exceeded*',
]);
echo 'Upload successful!';
