<?php
require __DIR__ . '/../../database.php';

// Configuration
$validSecret = 'mySecret';
$validPassphrase = 'myPass';
$uploadDir = normalizePath(__DIR__ . '/../../uploads/');
$errorDir = normalizePath(__DIR__ .  "/../../uploads_failed/");
$rawPagePath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathname = preg_replace('/\.[a-zA-Z0-9]+$/', '', $rawPagePath); // We want to strip file endings like '.html'

// Validate secret
if ($_POST['secret'] !== $validSecret) {
    http_response_code(403);
    exit('Unauthorized');
}

// Validate image data
if (!isset($_POST['image']) || !isset($_POST['username'])) {
    http_response_code(400);
    exit('Invalid input');
}

// Decode image
$imageData = $_POST['image'];
$imageData = str_replace('data:image/png;base64,', '', $imageData);
$imageData = str_replace(' ', '+', $imageData);
$decodedData = base64_decode($imageData);

if ($decodedData === false) {
    http_response_code(400);
    exit('Failed to decode image');
}

$tableName = $config['comments_table'];

// Get unique hash
try {
    $hash = getUniqueSecretFromDatabase($pdo, $tableName, "hash");
} catch (PDOException $e) {
    http_response_code(500);
    $millis = round(microtime(true) * 1000);
    $errorPath_without_hash = $errorDir . "comment_$millis.png";
    file_put_contents($errorPath_without_hash, $decodedData);
    exit('Database error: ' . $e->getMessage());
}

// Save image
$imageName = "comment_$hash.png";
$imagePath = $uploadDir . $imageName;
$errorPath = $errorDir . $imageName;

echo $imagePath . "<br>" . $errorPath;
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}
if (!file_exists($errorDir)) {
    mkdir($errorDir, 0755, true);
}

try {
    $stmt = $pdo->prepare("INSERT INTO $tableName (created, imagePath, target, approved, username, website, hash) VALUES (NOW(), ?, ?, NULL, ?, ?, ?)");
    $stmt->execute([$imagePath, $pathname, $_POST['username'], $_POST['website'] ?? '', $hash]);
    file_put_contents($imagePath, $decodedData);
    echo 'Upload successful!';
} catch (PDOException $e) {
    http_response_code(500);
    file_put_contents($errorPath, $decodedData);
    exit('Database error: ' . $e->getMessage());
}
