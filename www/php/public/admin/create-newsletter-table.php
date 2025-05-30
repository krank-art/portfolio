<?php
session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo "Access denied.";
    exit;
}

require __DIR__ . '/../../database.php';

$tableName = $config['newsletter_table'];

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS $tableName (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            validated TIMESTAMP DEFAULT NULL,
            secret VARCHAR(255) NOT NULL UNIQUE
        );
    ");
    echo "✅ Table '$tableName' created successfully (if already exists, nothing happened).";
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage();
}
