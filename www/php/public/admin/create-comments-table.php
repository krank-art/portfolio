<?php
session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo "Access denied.";
    exit;
}

require __DIR__ . '/../../database.php';

$tableName = $config['comments_table'];

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS $tableName (
            id INT AUTO_INCREMENT PRIMARY KEY,
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved TIMESTAMP DEFAULT NULL,
            target VARCHAR(255) NOT NULL,
            imagePath VARCHAR(255) NOT NULL,
            username VARCHAR(100) NOT NULL,
            website VARCHAR(255),
            hash VARCHAR(11) NOT NULL UNIQUE
        );
    ");
    echo "✅ Table '$tableName' created successfully (if already exists, nothing happened).";
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage();
}
