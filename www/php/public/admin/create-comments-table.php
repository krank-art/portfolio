<?php
session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo "Access denied.";
    exit;
}

require __DIR__ . '/../../database.php';

$commentsTableName = $config['comments_table'];
$rateLimitTableName = $config['comments_rate_limit_table'];
$settingsTableName = $config['comments_settings_table'];

// The HASH encodes values from 0 to 2^64 - 1. If we want to encode this with base64, we get 2^64 = 64^x.
// Then if we solve it, we get x = 32/3 (10.667) which is close enough for 11.

?>

<!DOCTYPE html>
<html>

<head>
    <title>Create Comments table</title>
    <link rel="stylesheet" type="text/css" href="/bundle.css">
</head>

<body>
    <div class="admin-panel-wrapper">
        <h1 class="admin-panel-heading">Create Comments table</h1>
        <div class="admin-panel-body">
        <header class="admin-panel-header">
            <a class="button-secondary" href="./">&larr; Go back to overview</a>
        </header>
        <?php
        // We intentionally use TIMESTAMP and not DATETIME. See readme.md under "Known Issues" for reasoning.
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS $commentsTableName (
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
            echo "<p>✅ Table '$commentsTableName' created successfully (if already exists, nothing happened).</p>";
        } catch (PDOException $e) {
            echo "<p>❌ Error: " . $e->getMessage() . "</p>";
        }
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS $rateLimitTableName (
                    key_hash         CHAR(64)  PRIMARY KEY,
                    burst_count      INT       NOT NULL DEFAULT 0,
                    mid_count        INT       NOT NULL DEFAULT 0,
                    long_count       INT       NOT NULL DEFAULT 0,
                    burst_expires_at TIMESTAMP NOT NULL,
                    mid_expires_at   TIMESTAMP NOT NULL,
                    long_expires_at  TIMESTAMP NOT NULL,
                    last_seen        TIMESTAMP NOT NULL
                );
            "); // Important: no trailing comma in SQL statement
            echo "<p>✅ Table '$rateLimitTableName' created successfully (if already exists, nothing happened).</p>";
        } catch (PDOException $e) {
            echo "<p>❌ Error: " . $e->getMessage() . "</p>";
        }
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS $settingsTableName (
                    id                               TINYINT   NOT NULL PRIMARY KEY CHECK (id = 1),
                    comment_attempt_count            INT       NOT NULL DEFAULT 0,
                    comment_attempt_limit_expires_at TIMESTAMP DEFAULT NULL,
                    last_comment_attempt_at          TIMESTAMP DEFAULT NULL
                );
            "); // Important: no trailing comma in SQL statement
            echo "<p>✅ Table '$settingsTableName' created successfully (if already exists, nothing happened).</p>";
        } catch (PDOException $e) {
            echo "<p>❌ Error: " . $e->getMessage() . "</p>";
        }
        ?>
        </div>
    </div>

</body>

</html>
