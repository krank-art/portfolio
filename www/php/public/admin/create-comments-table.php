<?php
session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo "Access denied.";
    exit;
}

require __DIR__ . '/../../database.php';

$tableName = $config['comments_table'];

// The HASH encodes values from 0 to 2^64 - 1. If we want to encode this with base64, we get 2^64 = 64^x.
// Then if we solve it, we get x = 32/3 (10.667) which is close enough for 11.

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS $tableName (
            id           INT          AUTO_INCREMENT PRIMARY KEY,
            created      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            approved     TIMESTAMP    DEFAULT NULL,
            trashed      TIMESTAMP    DEFAULT NULL,
            target       VARCHAR(255) NOT NULL,
            imagePath    VARCHAR(255) NOT NULL,
            historyPath  VARCHAR(255) NOT NULL,
            username     VARCHAR(100) NOT NULL,
            website      VARCHAR(255) DEFAULT NULL,
            hash         CHAR(11)     NOT NULL UNIQUE,
            submissionId CHAR(10)     NOT NULL
        );
    "); // Important: no trailing comma in SQL statement
    echo "✅ Table '$tableName' created successfully (if already exists, nothing happened).";
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage();
}
