<?php
require 'database.php';

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function generateSecret($length = 16) {
    return base64url_encode(random_bytes($length / 2));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['email'])) {
    $email = trim($_POST['email']);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die("❌ Invalid email.");
    }

    try {
        // Guarantee that secret is unique
        $secret = generateSecret();
        $maxTries = 20;
        $attempts = 0;
        $secretIsUnique = false;
        while (!$secretIsUnique) {
            $attempts++;
            if ($attempts >= $maxTries) {
                throw new Exception("Too many attempts getting unique secret: $attempts");
            }
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM " . $config['newsletter_table'] . " WHERE secret = ?");
            $stmt->execute([$secret]);
            $secretIsUnique = !($stmt->fetchColumn());
            //echo $secret;
            if(!$secretIsUnique) $secret = generateSecret();
        }

        // Check if email already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM " . $config['newsletter_table'] . " WHERE email = ?");
        $stmt->execute([$email]);
        $exists = $stmt->fetchColumn();

        if ($exists) {
            echo "✅ You are already subscribed!";
        } else {
            $stmt = $pdo->prepare("INSERT INTO " . $config['newsletter_table'] . " (email, joined, validated, secret) VALUES (?, NOW(), NULL, ?)");
            $stmt->execute([$email, $secret]);
            echo "🎉 Subscribed successfully!";
        }

    } catch (PDOException $e) {
        echo "❌ Database error: " . $e->getMessage();
    }
} else {
    echo "❌ Invalid request.";
}
?>
