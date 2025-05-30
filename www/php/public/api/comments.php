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

require __DIR__ . '/../../database.php';

$tableName = $config['comments_table'];

try {
    // Query the data
    $stmt = $pdo->query("
        SELECT created, approved, imagePath, username, website 
        FROM $tableName 
        WHERE target = '$target' 
        ORDER BY created DESC
    ");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Output JSON
    echo json_encode([
        'success' => true,
        'data' => $results
    ]);

} catch (PDOException $e) {
    // On error, send error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}