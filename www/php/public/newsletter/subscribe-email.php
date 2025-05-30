<?php
require __DIR__ . '/../../database.php';

$tableName = $config['comments_table'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['email'])) {
    $email = trim($_POST['email']);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die("❌ Invalid email.");
    }

    try {
        $secret = getUniqueSecretFromDatabase($pdo, $tableName, "secret");

        // Check if email already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM $tableName WHERE email = ?");
        $stmt->execute([$email]);
        $exists = $stmt->fetchColumn();

        if ($exists) {
            echo "✅ You are already subscribed!";
        } else {
            $stmt = $pdo->prepare("INSERT INTO $tableName (email, joined, validated, secret) VALUES (?, NOW(), NULL, ?)");
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
