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
    <title>Send newsletter</title>
    <link rel="stylesheet" type="text/css" href="/bundle.css">
</head>

<body>
    <div class="admin-panel-wrapper">
        <h1 class="admin-panel-heading">Send newsletter</h1>
        <div class="admin-panel-body">
        <header class="admin-panel-header">
            <a class="button-secondary" href="./">&larr; Go back to overview</a>
        </header>

<?php

$stmt = $pdo->query("SELECT email,validated,`secret` FROM " . $config['newsletter_table']);
$emails = $stmt->fetchAll();

$sent = 0;
$failed = 0;

foreach ($emails as $row) {
    $email = $row['email'];
    $validated = $row['validated'];
    $secret = $row['secret'];
    $unsubscribeLink = "https://krank.love/unsubscribe?e=" . rawurlencode($email) . "&s=" . $secret;

    /*
     * The problem with the email function is that email hosting providers have quite sophisticated spam detection methods.
     * Even if we just include a single url to this very website, it gets marked as spam and potentially malicious.
     * A proper mailing library could help (e.g. PHPMailer), but introduces a whole lot more complexity for a feature 
     * that was intended to be as simple as possible.
     * 
     * The original intended process was to type in your email adress and then confirm your email as real by clicking 
     * on the validation URL. This link includes the secret from the database, ensuring that only the email owner can 
     * subscribe and unsubscribe from the mailing list. Tho the spam detection of Gmail seemed to particularly dislike 
     * an email coming from a random source, including an URL with multiple query parameters.
     * 
     * To be honest, this is the last nail in the coffin for the newsletter feature.
     * It is bad enough to actually store the email addresses of random people in terms of data security.
     * If there's a breach in the database or if I do not configure the environment correctly, there is a data leak.
     * Also I would need to include some type of data privacy policy and be legally viable for safety and deletion.
     * Moreover in the world of furries, people are reluctant to share their private email addresses (very sensible).
     * 
     * The thing is, this email sending capability of PHP is still useful to notify myself of events on the website.
     * I have worked on a comment drawing feature, similar to MiiVerse on Wii U back then.
     * With that project I have to problem that a submitted comments should always be reviewed for indecent content.
     * One solution would be a submission feature where I need to sign off each common individually to be safe.
     * Oh I just had the idea of reviewing each comment manually, and listing them all.
     * If they have not been reviewed yet, the user has to explicitly click a button for them to appear from a spoiler.
     */

    $to = $email;
    $subject = "Krank Newsletter";
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

?>

        </div>
    </div>

</body>

</html>
