<?php
session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo "Access denied.";
    exit;
}

// ✅ Only admins reach this point
// Do your protected admin action here (e.g., delete rows, run a script)

require 'database.php';

$stmt = $pdo->query("SELECT NOW() AS access_time");
$row = $stmt->fetch();
echo "<h1>Current DB Time: " . htmlspecialchars($row['access_time']) . "</h1>";
echo "Admin action executed!";
