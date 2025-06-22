<?php

session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo "Access denied.";
    exit;
}

require __DIR__ . '/../../database.php';

$tableName = $config['comments_table'];
$perPage = 20;

// Get current page from query string
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$offset = ($page - 1) * $perPage;

try {
    // Get total number of entries
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM $tableName");
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $totalPages = ceil($total / $perPage);
    // Fetch submissions
    $stmt = $pdo->prepare("SELECT * FROM $tableName ORDER BY created DESC LIMIT :limit OFFSET :offset");
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database error: " . $e->getMessage());
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Submissions</title>
    <style>
        body { font-family: sans-serif; padding: 2em; }
        .entry { margin-bottom: 2em; border-bottom: 1px solid #ccc; padding-bottom: 1em; }
        img { max-width: 300px; display: block; margin-top: 0.5em; }
        .pagination a { margin: 0 5px; text-decoration: none; }
        .pagination strong { margin: 0 5px; }
    </style>
</head>
<body>

<h1>Submissions (Page <?= $page ?> of <?= $totalPages ?>)</h1>

<?php if ($entries): ?>
    <?php foreach ($entries as $row): ?>
        <div class="entry">
            <strong>ID:</strong> <?= htmlspecialchars($row['id']) ?><br>
            <strong>Created:</strong> <?= htmlspecialchars($row['created']) ?><br>
            <strong>Approved:</strong> <?= $row['approved'] ?? 'Not approved' ?><br>
            <strong>Target:</strong> <?= htmlspecialchars($row['target']) ?><br>
            <strong>Username:</strong> <?= htmlspecialchars($row['username']) ?><br>
            <strong>Website:</strong> <?= htmlspecialchars($row['website']) ?><br>
            <strong>Hash:</strong> <?= htmlspecialchars($row['hash']) ?><br>
            <strong>Submission ID:</strong> <?= htmlspecialchars($row['submissionId']) ?><br>
            <img src="<?= htmlspecialchars($row['imagePath']) ?>" alt="Image">
            <br>
            <a href="<?= htmlspecialchars($row['historyPath']) ?>">View History</a>
        </div>
    <?php endforeach; ?>
<?php else: ?>
    <p>No entries found.</p>
<?php endif; ?>

<div class="pagination">
    <?php for ($i = 1; $i <= $totalPages; $i++): ?>
        <?php if ($i == $page): ?>
            <strong><?= $i ?></strong>
        <?php else: ?>
            <a href="?page=<?= $i ?>"><?= $i ?></a>
        <?php endif; ?>
    <?php endfor; ?>
</div>

</body>
</html>
