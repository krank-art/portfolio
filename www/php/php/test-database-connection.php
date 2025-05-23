<?php
session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo "Access denied.";
    exit;
}

require 'database.php';

try {
    $stmt = $pdo->query("SELECT NOW() AS access_time");
    $row = $stmt->fetch();
    echo "<h1>Connection successful!</h1>";
    echo "Current DB Time: " . htmlspecialchars($row['access_time']);
} catch (PDOException $e) {
    echo "Connection failed: " . htmlspecialchars($e->getMessage());
}
