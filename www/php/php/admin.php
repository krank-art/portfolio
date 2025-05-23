<?php
session_start();

// Define your admin password here (store in env file or config in production)
$adminPassword = 'supersecret123';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if ($_POST['password'] === $adminPassword) {
        $_SESSION['is_admin'] = true;
    } else {
        $error = "Incorrect password.";
    }
}

// Logout
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: index.php");
    exit;
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Admin Panel</title>
    <style>
        body { font-family: sans-serif; margin: 2em; }
        .panel { margin-top: 1em; padding: 1em; border: 1px solid #ccc; max-width: 400px; }
        .error { color: red; }
    </style>
</head>
<body>

<h2>Admin Panel</h2>

<?php if (!isset($_SESSION['is_admin'])): ?>
    <form method="POST">
        <div class="panel">
            <label>Enter Admin Password:</label><br>
            <input type="password" name="password" required>
            <button type="submit">Login</button>
            <?php if (!empty($error)) echo "<p class='error'>$error</p>"; ?>
        </div>
    </form>
<?php else: ?>
    <div class="panel">
        <h3>Admin Controls</h3>
        <ul>
            <li><a href="/send-newsletter.php">📥 Send newsletter</a></li>
            <li><a href="#">🧹 Clear database</a></li>
            <li><a href="#">🔧 System settings</a></li>
        </ul>
        <p><a href="?logout=1">Logout</a></p>
    </div>
<?php endif; ?>

</body>
</html>
