function scrollToHashWhenReady({selector, timeout = 5000, interval = 100}) {
  const start = Date.now();
  const tryScroll = setInterval(() => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      el.classList.add("target");
      addEventListener('hashchange', function () {
        el.classList.remove("target");
      });
      clearInterval(tryScroll);
    } else if (Date.now() - start > timeout) {
      clearInterval(tryScroll);
      console.warn(`Element ${selector} not found within ${timeout}ms`);
    }
  }, interval);
}

function formatSmartDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const inputDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const time = date.toLocaleTimeString("en-US", {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  if (inputDay.getTime() === today.getTime())
    return `Today, ${time}`;
  if (inputDay.getTime() === yesterday.getTime())
    return `Yesterday, ${time}`;
  const dayMonthYear = date.toLocaleDateString("en-US", {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return `${dayMonthYear}, ${time}`;
}

export async function setupCommentList({ sidebar }) {
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

    //TODO: Jump to hash when comments have loaded

    // Clear existing content
    commentListEl.innerHTML = '';
    const listing = document.createElement("ol");
    listing.className = "comment-list";
    commentListEl.appendChild(listing);

    // TODO: Setting "innerHTML" when receiving user data is quite dumb bc of code injection

    comments.forEach(comment => {
      const item = document.createElement('li');
      const commentId = "comment-" + comment.hash;
      const approvedTag = `<span class="comment-approved" title="This comment has been checked by staff.">✔</span>`;
      const asideArea = `
        <div class="comment-aside">
          <a class="comment-referral" href="${comment.website}" target="_blank">${comment.website}</a>
        </div>
      `;
      item.className = 'comment-list-item';
      item.innerHTML = `
        <div class="comment" id="${commentId}">
          <div class="comment-header">
            <h4 class="comment-title">${comment.username} ${comment.approved ? approvedTag : ''}</h4>
            <time datetime="${comment.created}" class="comment-date">${formatSmartDate(comment.created)}</time>
            <a class="comment-anchor" href="#${commentId}" title="Link to comment">#</a>
          </div>
          ${comment.approved && comment.website ? asideArea : ''}
          <div class="comment-body">
            <img class="comment-image" src="${comment.imagePath}" alt="Comment by ${comment.username}">
          </div>
        </div>
      `;
      listing.appendChild(item);
    });

    const hash = window.location.hash;
    if (hash.startsWith("#comment-")) {
      if (!sidebar.isOpen) sidebar.open();
      scrollToHashWhenReady({ selector: hash, timeout: 2000 });
    }
  } catch (err) {
    console.error('Error loading comments:', err);
    commentListEl.textContent = 'Failed to load comments.';
  }
}
