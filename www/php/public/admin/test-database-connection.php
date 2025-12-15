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
    <title>Test database connection</title>
    <link rel="stylesheet" type="text/css" href="/bundle.css">
</head>

<body>
    <div class="admin-panel-wrapper">
        <h1 class="admin-panel-heading">Test database connection</h2>
        <div class="admin-panel-body">
        <header class="admin-panel-header">
            <a class="button-secondary" href="./">&larr; Go back to overview</a>
        </header>

        <?php

        try {
            $stmt = $pdo->query("SELECT NOW() AS access_time");
            $row = $stmt->fetch();
            echo "<h2>Connection successful!</h2>";
            echo "Current DB Time: " . htmlspecialchars($row['access_time']);
        } catch (PDOException $e) {
            echo "Connection failed: " . htmlspecialchars($e->getMessage());
        }
        ?>

    </div>

</body>

</html>
