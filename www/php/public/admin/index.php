<?php
session_start();
require __DIR__ . '/../../database.php';

$adminPassword = getenv('ADMIN_PANEL_PASS');

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
        body { font-family: sans-serif; margin: 2em auto; max-width: 400px; }
        .panel { margin-top: 1em; padding: 1em; border: 1px solid #ccc; }
        .error { color: red; }
        .action-list { list-style-type: none;}
        .action-list > *:not(:last-child) {margin-bottom: 1em;}
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
        <ul class="action-list">
            <li>
                <a href="./test-database-connection.php">🔧 Test database connection</a><br>
                <small>Manual test if the provided database can be reached.</small>
            </li>
            <li>
                <a href="./create-newsletter-table.php">🧹 Create newsletter table</a><br>
                <small>Creates database table for newsletter adresses. If the table already exists, nothing happens.</small>
            </li>
            <li>
                <a href="./send-newsletter.php">📥 Send newsletter</a><br>
                <small>
                    This will send an update notification email to all subscribers.
                    We won't send emails to unvalidated people, imagine someone just adding random email adresses without the owner's consent.
                </small>
            </li>
            <li>
                <a href="./create-comments-table.php">💬 Create comments table</a><br>
                <small>Creates database table for drawn comments. If the table already exists, nothing happens.</small>
            </li>
        </ul>
        <p><a href="?logout=1">Logout</a><br>
        <small>(Session will expire after 24 minutes of inaction)</small></p>
    </div>
<?php endif; ?>

</body>
</html>
