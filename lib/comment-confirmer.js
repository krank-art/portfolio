import { drawBarcode } from "./barcode";

function generateRandomDigitNumber(length) {
  let digits = '';
  for (let i = 0; i < length; i++)
    digits += Math.floor(Math.random() * 10);
  return digits;
}

export function showCommentDialog({ drawnImageBase64, inputRecords, commentedPicPath, commentedPicAlt, secret, target, uploadPath }) {
  const dialog = document.createElement('dialog');
  dialog.classList.add("comment-confirmer")

  // Create the form
  const form = document.createElement('form');
  form.method = 'dialog'; // Native dialog form handling

  form.innerHTML = `
      <div class="comment-confirmer-header">
        <h3 class="comment-confirmer-title">Submit Comment</h3>
        <canvas class="comment-confirmer-barcode" id="submissionId" width="110" height="40" title="Submission ID"></canvas>
      </div>

      <img class="comment-confirmer-target" src="${commentedPicPath}" alt="Image being commented">
      <div class="comment-confirmer-body">
        <div class="comment-confirmer-target-box">
          <img class="comment-confirmer-comment" src="${drawnImageBase64}" alt="Your drawn comment" width="320" height="120">
        </div>

        <div class="comment-confirmer-input-row inputs">
          <label for="username">Username:</label>
          <input class="comment-confirmer-input" type="text" name="username" required>
        </div>

        <div class="comment-confirmer-input-row inputs">
          <label for="Website">Website:</label>
          <input class="comment-confirmer-input" type="url" name="website">
        </div>

        <input type="hidden" name="secret" value="${secret}">
        <input type="hidden" name="target" value="${target}">
        <input type="hidden" name="inputs" value="PLACEHOLDER">
        <input type="hidden" name="submissionId" value="PLACEHOLDER">

        <div class="comment-confirmer-input-row">
          <label class="comment-confirmer-checkbox">
            <input type="checkbox" name="agreement" required>
          </label>
          <label for="agreement">I agree that my comment may be publicly displayed and stored on this site.</label>
        </div>

        <small>
        Contact <code>comments@krank.love</code> for takedown requests.
        Please keep a screenshot of this form as receipt.</small>

        <div class="actions">
          <button type="submit">Submit</button>
          <button type="button" onclick="this.closest('dialog').close()">Cancel</button>
        </div>
      </div>
    `;

  // When sending in a comment, users can take a screenshot of the comment form. 
  // If they later want to verify their identity, they can use the submission id to prove that they
  // did in fact send in the comment.
  const submissionId = generateRandomDigitNumber(10);
  const submissionIdCanvas = form.querySelector("#submissionId");
  const submissionIdField = form.querySelector("[name=submissionId]");
  submissionIdField.value = submissionId;
  drawBarcode({ canvas: submissionIdCanvas, data: submissionId, height: 20, barWidth: 1 });

  dialog.appendChild(form);
  document.body.appendChild(dialog);
  dialog.showModal();

  // Optional: handle submit
  form.onsubmit = () => {
    const commentData = new FormData(form);
    commentData.append('image', drawnImageBase64);
    commentData.append('history', inputRecords);
    // Apparently this gets sent with enctype="multipart/form-data"
    // Not sure why exactly, because the browser is supposed to use the default ("application/x-www-form-urlencoded")
    // and only switch over to "multipart/form-data" when a Blob or derivative of File is being appended to the
    // FormData (https://developer.mozilla.org/en-US/docs/Web/API/FormData/append).
    // This is important for us because we handle the upload with a PHP script. If the FormData is sent with method
    // POST and enctype="application/x-www-form-urlencoded", then "$_FILES" will not get populated. We want to use
    // "$_FILES" tho because it gives us very helpful tools when examining the image and brush history being sent.
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
