<?php
require __DIR__ . '/../../database.php';

try {
    $stmt = $pdo->query("SELECT NOW() AS access_time");
    $row = $stmt->fetch();

    echo "<h1>Current DB Time: " . htmlspecialchars($row['access_time']) . "</h1>";

} catch (PDOException $e) {
    echo "Connection failed: " . htmlspecialchars($e->getMessage());
}
