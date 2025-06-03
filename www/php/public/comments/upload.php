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
if (!isset($_POST['image']) || !isset($_POST['username']) || !isset($_POST['target'])) {
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

// Create GD image from string
$srcImage = @imagecreatefromstring($decodedData); // We suppress bc we have error logging below
if (!$srcImage) {
    http_response_code(400);
    echo 'Failed to create image from data.';
    exit;
}

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

// TODO: We could use ImageMagick instead of libgd (GD library) to add metadata,
//   but for simplicities sake we will refrain from using it for now.
// TODO: As of now, any valid PNG will be accepted and copied without transparency.
//   A more robust approach would be to rebuild the brush engine and replay the brush history.

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

// TIMESTAMP in MariaDB is always stored as date UTC+0, so we need to set the server timezone before adding to DB
date_default_timezone_set('UTC');

try {
    $sanitizedUsername = htmlspecialchars($_POST['username'], ENT_QUOTES, 'UTF-8');
    $sanitizedWebsite = htmlspecialchars($_POST['website'], ENT_QUOTES, 'UTF-8');
    $sanitizedTarget = htmlspecialchars($_POST['target'], ENT_QUOTES, 'UTF-8');
    $stmt = $pdo->prepare("INSERT INTO $tableName (created, imagePath, target, approved, username, website, hash) VALUES (NOW(), ?, ?, NULL, ?, ?, ?)");
    $stmt->execute([$imagePath, $sanitizedTarget, $sanitizedUsername, $sanitizedWebsite ?? '', $hash]);
    file_put_contents($imagePath, $newImage);
    echo 'Upload successful!';
} catch (PDOException $e) {
    http_response_code(500);
    file_put_contents($errorPath, $newImage);
    exit('Database error: ' . $e->getMessage());
}
