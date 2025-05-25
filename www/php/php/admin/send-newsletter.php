<?php
session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo "Access denied.";
    exit;
}

require __DIR__ . '/../database.php';

$stmt = $pdo->query("SELECT email,validated,`secret` FROM " . $config['newsletter_table']);
$emails = $stmt->fetchAll();

$sent = 0;
$failed = 0;

foreach ($emails as $row) {
    $email = $row['email'];
    $validated = $row['validated'];
    $secret = $row['secret'];
    $unsubscribeLink = "https://krank.love/unsubscribe?e=" . rawurlencode($email) . "&s=" . $secret;
    $to = $email;
    $subject = "Notification from Our App";
    $message = "Hello!\n\nThere is a new update on https://krank.love/ ʕ•ᴥ•ʔ\n\n" . 
               "To unsubscribe from this newsletter, please go to " . $unsubscribeLink;
    $headers = 'From: contact@krank.love' . "\r\n" .
               'Reply-To: contact@krank.love' . "\r\n" .
               'X-Mailer: PHP/' . phpversion();

    if (mail($to, $subject, $message, $headers)) {
        $sent++;
    } else {
        $failed++;
        echo error_get_last();
    }
}

echo "✅ Sent: $sent\n❌ Failed: $failed";
