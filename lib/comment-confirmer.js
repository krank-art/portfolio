export function showCommentDialog({ drawnImageBase64, inputRecords, commentedPicPath, commentedPicAlt, secret, target, uploadPath }) {
  const dialog = document.createElement('dialog');

  // Create the form
  const form = document.createElement('form');
  form.method = 'dialog'; // Native dialog form handling

  form.innerHTML = `
      <h3>Submit Your Comment</h3>

      <label>
        Username:
        <input type="text" name="username" required>
      </label>

      <label>
        Website:
        <input type="url" name="website">
      </label>

      <input type="hidden" name="secret" value="${secret}">
      <input type="hidden" name="target" value="${target}">
      <input type="hidden" name="inputs" value="${JSON.stringify(inputRecords)}">

      <p>Image being commented:</p>
      <img src="${commentedPicPath}" alt="${commentedPicAlt}">

      <p>Your drawn comment:</p>
      <img src="${drawnImageBase64}" alt="Drawn Comment">

      <div class="actions">
        <button type="submit">Submit</button>
        <button type="button" onclick="this.closest('dialog').close()">Cancel</button>
      </div>
    `;

  dialog.appendChild(form);
  document.body.appendChild(dialog);
  dialog.showModal();

  // Optional: handle submit
  form.onsubmit = () => {
    const commentData = new FormData(form);
    commentData.append('image', drawnImageBase64);
    fetch(uploadPath, {
      method: 'POST',
      body: commentData,
    })
      .then(response => response.text())
      .then(result => alert(result))
      .catch(error => console.error('Error:', error));
    dialog.remove();
  };

  dialog.addEventListener('close', () => {
    dialog.remove();
  });
}
