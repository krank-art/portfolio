<?php
$host = 'mariadb'; // This matches the service name in docker-compose
$db   = 'exampledb';
$user = 'exampleuser';
$pass = 'examplepass';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    // Simple read query as example
    $stmt = $pdo->query("SELECT NOW() AS access_time");
    $row = $stmt->fetch();

    echo "<h1>Current DB Time: " . htmlspecialchars($row['access_time']) . "</h1>";

} catch (PDOException $e) {
    echo "Connection failed: " . htmlspecialchars($e->getMessage());
}
