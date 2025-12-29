<?php
// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // optional: allow CORS

$expectedSecret = 'mySuperSecret123';
$providedSecret = $_GET['secret'] ?? $_POST['secret'] ?? getallheaders()['X-Api-Secret'] ?? null;
if ($providedSecret !== $expectedSecret) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'Forbidden: invalid or missing secret'
    ]);
    exit;
}

$target = $_GET['target'] ?? null;
if (!isset($target) || empty($target)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Missing required parameter: target'
    ]);
    exit;
}

function formatDate($someDate) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format
    // We use the date format of JS with "yyyy-mm-ddThh-ii-ssZ" where T is a time literal and Z means "UTC+0"
    return $someDate->format('Y-m-d') . "T" . $someDate->format('H:i:s') . "Z";
}

require __DIR__ . '/../../database.php';

$tableName = $config['comments_table'];

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
    // On error, send error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
