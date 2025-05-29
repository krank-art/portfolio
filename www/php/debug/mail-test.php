<?php
$to      = 'kranko.art@gmail.com';
$subject = 'Test Email from PHP';
$message = "Hello,\nThis is a test email sent using PHP's mail() function." . time();
$headers = 'From: contact@krank.love' . "\r\n" .
           'Reply-To: contact@krank.love' . "\r\n" .
           'X-Mailer: PHP/' . phpversion();

if (mail($to, $subject, $message, $headers)) {
    echo "Email sent successfully.";
} else {
    echo "Email sending failed.";
}
// Welp this actually works
// TODO: Make actual emails a secret to not leak in git repository
?>
