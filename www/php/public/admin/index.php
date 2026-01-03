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
    <link rel="stylesheet" type="text/css" href="/bundle.css">
</head>

<body>
    <div class="admin-panel-wrapper">
        <h1 class="admin-panel-heading">🐻 Admin Panel</h1>
        <?php if (!isset($_SESSION['is_admin'])): ?>
            <form method="POST">
                <div class="admin-panel-body">
                    <header class="admin-panel-header">
                        <a class="button-secondary" href="/">&larr; Go back to main page</a>
                    </header>
                    <label class="label" for="admin-password">Enter Admin Password:</label><br>
                    <input id="admin-password" class="input <?= !empty($error) ? 'error' : '' ?>" type="password" name="password" required>
                    <button class="button-primary" type="submit">Login</button>
                    <?php if (!empty($error)) echo "<p class='admin-panel-error'>$error</p>"; ?>
                </div>
            </form>
        <?php else: ?>
            <div class="admin-panel-body">
                <ul class="admin-action-list">
                    <li>
                        <a href="./test-database-connection">🔧 Test database connection</a><br>
                        <small>Manual test if the provided database can be reached.</small>
                    </li>
                    <li>
                        <a href="./create-newsletter-table">✉️➕ Create newsletter table</a><br>
                        <small>Creates database table for newsletter adresses. If the table already exists, nothing happens.</small>
                    </li>
                    <li>
                        <a href="./send-newsletter">✉️📥 Send newsletter</a><br>
                        <small>
                            This will send an update notification email to all subscribers.
                            We won't send emails to unvalidated people, imagine someone just adding random email adresses without the owner's consent.<br>
                            <span class="admin-panel-warning">Warning: This feature does not work that well. Most browsers put emails sent by
                                this website into the spam folder, which defeats the purpose of a mailing list.</span>
                        </small>
                    </li>
                    <li>
                        <a href="./create-comments-table">💬➕ Create comments tables</a><br>
                        <small>Creates database tables for drawn comments and rate limiting. If the tables already exists, nothing happens.</small>
                    </li>
                    <li>
                        <a href="./review-comments">💬📋 Review comments</a><br>
                        <small>Review all comments, approve or delete them. If you want to edit individual fields, you need
                            to connect to the database via SSH.</small>
                    </li>
                </ul>
                <p><a href="?logout=1">Logout</a><br>
                    <small>(Session will expire after 24 minutes of inaction)</small>
                </p>
            </div>
        <?php endif; ?>
    </div>

</body>

</html>