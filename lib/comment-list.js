export async function setupCommentList() {
  const commentListEl = document.getElementById('comment-list');
  if (!commentListEl) return;
  const secret = encodeURIComponent("mySuperSecret123");
  const target = encodeURIComponent(location.pathname);

  try {
    const response = await fetch(`/api/comments?target=${target}&secret=${secret}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const dataResponse = await response.json();
    const comments = dataResponse.data;
    if (!Array.isArray(comments) || comments.length === 0) {
      commentListEl.textContent = 'No comments yet.';
      return;
    }

    // Clear existing content
    commentListEl.innerHTML = '';

    comments.forEach(comment => {
      const item = document.createElement('div');
      item.className = 'comment';
      item.innerHTML = `
        <strong>${comment.username || 'Anonymous'}</strong>
        <small>(${new Date(comment.created).toLocaleString()})</small><br>
        <img src="${comment.imagePath}" alt="comment image" style="max-width: 200px;"><br>
        <a href="${comment.website}" target="_blank">${comment.website}</a>
        <hr>
      `;
      commentListEl.appendChild(item);
    });

  } catch (err) {
    console.error('Error loading comments:', err);
    commentListEl.textContent = 'Failed to load comments.';
  }
}
