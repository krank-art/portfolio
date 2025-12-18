<?php
session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo "Access denied.";
    exit;
}

require __DIR__ . '/../../database.php';

?>

<!DOCTYPE html>
<html>

<head>
    <title>Create newsletter table</title>
    <link rel="stylesheet" type="text/css" href="/bundle.css">
</head>

<body>
    <div class="admin-panel-wrapper">
        <h1 class="admin-panel-heading">Create newsletter table</h1>
        <div class="admin-panel-body">
        <header class="admin-panel-header">
            <a class="button-secondary" href="./">&larr; Go back to overview</a>
        </header>

        <?php
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
        ?>

    </div>

</body>

</html>