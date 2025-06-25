<?php
session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo "Access denied.";
    exit;
}

require __DIR__ . '/../../database.php';

?>

<h1>Test database connection</h1>
<p><a href="./">Go back to overview</a></p>

<?php

try {
    $stmt = $pdo->query("SELECT NOW() AS access_time");
    $row = $stmt->fetch();
    echo "<h2>Connection successful!</h2>";
    echo "Current DB Time: " . htmlspecialchars($row['access_time']);
} catch (PDOException $e) {
    echo "Connection failed: " . htmlspecialchars($e->getMessage());
}
