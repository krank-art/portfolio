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

$stmt = $pdo->query("SELECT email,validated,`secret` FROM krank_subscribers");
$emails = $stmt->fetchAll();

$sent = 0;
$failed = 0;

foreach ($emails as $row) {
    $to = $row['email'];
    $subject = "Notification from Our App";
    $message = "Hello!\n\nThere is a new update on https://krank.love/ ʕ•ᴥ•ʔ\n\n" . 
               "To unsubscribe from this newsletter, please go to https://krank.love/unsubscribe?e=" . rawurlencode($email);
    $headers = 'From: contact@krank.love' . "\r\n" .
               'Reply-To: contact@krank.love' . "\r\n" .
               'X-Mailer: PHP/' . phpversion();

    if (mail($to, $subject, $message, $headers)) {
        $sent++;
    } else {
        $failed++;
    }
}

echo "✅ Sent: $sent\n❌ Failed: $failed";

$stmt = $pdo->query("SELECT NOW() AS access_time");
$row = $stmt->fetch();
echo "<h1>Current DB Time: " . htmlspecialchars($row['access_time']) . "</h1>";
echo "Admin action executed!";
