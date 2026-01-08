<?php

function showErrorAndExit($errorLogPath, $code, $message, $internalMessage = null)
{
    // WARNING: Do treat $message as public and $internalMessage as private. 
    // We do not want to leak database details or PHP script details on an internal error.
    //if (!file_exists($errorLogDir))
    //    mkdir($errorLogDir, 0755, true);
    $errorMessage = "$code $message" . ($internalMessage ? " $internalMessage " : "");
    writeErrorLog($errorLogPath, $errorMessage);
    error_log($errorMessage);
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit();
}

function formatDate($someDate)
{
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format
    // We use the date format of JS with "yyyy-mm-ddThh-ii-ssZ" where T is a time literal and Z means "UTC+0"
    return $someDate->format('Y-m-d') . "T" . $someDate->format('H:i:s') . "Z";
}

require __DIR__ . '/../../database.php';
$tableName = $config['comments_table'];
$uploadDir = $config['commentsUploadDir'];
$errorLogPath = $config['errorLogFile'];

// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // optional: allow CORS

$expectedSecret = 'mySuperSecret123';
$providedSecret = $_GET['secret'] ?? $_POST['secret'] ?? getallheaders()['X-Api-Secret'] ?? null;
if ($providedSecret !== $expectedSecret)
    showErrorAndExit($errorLogPath, 403, "Forbidden: invalid or missing secret", $providedSecret);

$target = $_GET['target'] ?? null;
if (!isset($target) || empty($target))
    showErrorAndExit($errorLogPath, 400, "Missing required parameter: target");

try {
    // Env variables are always string
    $extraFilter = getenv("COMMENTS_SHOW_UNVERIFIED") === "true" ? "" : "AND approved IS NOT NULL";
    // Query the data
    $stmt = $pdo->prepare("
        SELECT created, approved, imagePath, historyPath, username, website, target, hash
        FROM $tableName 
        WHERE target = ? AND trashed IS NULL $extraFilter
        ORDER BY created DESC
    ");
    $stmt->execute([$target]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $formattedResults = array_map(function ($record) {
        $record['imagePath'] = str_replace($_SERVER["DOCUMENT_ROOT"], '', $record['imagePath']);
        $record['historyPath'] = str_replace($_SERVER["DOCUMENT_ROOT"], '', $record['historyPath']);
        $record['created'] = formatDate(new DateTime($record['created']));
        return $record;
    }, $results);

    // Output JSON
    echo json_encode([
        'success' => true,
        'data' => $formattedResults,
    ]);
} catch (PDOException $e) {
    showErrorAndExit($errorLogPath, 500, "Database error", $e->getMessage());
}
