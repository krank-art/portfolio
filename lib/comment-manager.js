import { showCommentDialog } from "./comment-confirmer";
import CommentDrawer from "./comment-drawer";
import { decodeCommentHistory, encodeCommentHistory } from "./comment-file";

function getImageSrcsetPath(imageElement, searchedPath) {
  const srcset = imageElement.getAttribute('srcset');
  if (!srcset) return null;
  const entries = srcset.split(',').map(entry => entry.trim().split(' ')[0]);
  const match = entries.find(src => src.includes(searchedPath));
  return match ?? null;
}

function setupCommentDrawer({ width, height, scale, version }) {
  const container = document.getElementById("comment-drawer");
  if (!container) return;
  const commentedPic = document.querySelector(".gallery-image");
  const commentDrawer = new CommentDrawer({
    width: width,
    height: height,
    scale: scale,
    container: container,
    onSubmit: (image, inputRecords) => {
      const commentHistoryBytes = encodeCommentHistory({
        version: version,
        width,
        height,
        strokes: inputRecords,
      });
      const commentHistoryFile = new Blob([commentHistoryBytes], { type: 'application/octet-stream' })
      showCommentDialog({
        // TODO: Save input records on server
        drawnImageBase64: image,
        inputRecords: commentHistoryFile,
        commentedPicPath: commentedPic ? getImageSrcsetPath(commentedPic, "/480p/") : null,
        commentedPicAlt: commentedPic ? commentedPic.alt : null,
        secret: "mySecret",
        target: location.pathname,
        uploadPath: "/comments/upload",
      });
    },
  });
}

export function setupCommentPlayer({ width, height, scale, intervalPause = undefined }) {
  const commentPlayer = new CommentPlayer({width, height, scale, intervalPause});
  commentPlayer.startScheduler();
}

class CommentPlayer {
  /** @type {CommentDrawer} */    player;
  /** @type {Set<HTMLElement>} */ visibleComments = new Set();
  /** @type {HTMLElement} */      lastPlayedElement = null;
  /** @type {number} */           scheduleTimer = null;
  /** @type {boolean} */          isPlaying = false;
  /** @type {number} */           intervalPause;
  /** @type {IntersectionObserver} */ observer;

  constructor({ width, height, scale, intervalPause = 3000 }) {
    this.player = new CommentDrawer({
      width: width,
      height: height,
      scale: scale,
      container: null,
      mode: "player",
    });
    this.intervalPause = intervalPause;
    this.setupIntersectionObserver();
  }

  startScheduler() {
    this.scheduleNextPlayCheck();
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting)
          this.visibleComments.add(entry.target);
        else
          this.visibleComments.delete(entry.target);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.comment-replayable').forEach(el => this.observer.observe(el));
  }

  /**
   * @param {HTMLElement} comment 
   */
  async playReplayableComment(comment, onPlaybackEnd = () => {}) {
    // We need to hide while switching comments, otherwise there is a flash of the previously comment on the new one.
    this.player.hide(); 
    this.player.attachToElement(comment);
    const historyFileSrc = comment.dataset.historySrc;
    if (!historyFileSrc) {
      console.warn(`Missing attribute 'data-history-src' on replayable comment ${comment}`);
      return;
    }
    const historyFile = await fetch(historyFileSrc)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.arrayBuffer();
      })
      .then(buffer => decodeCommentHistory(buffer))
      .catch(error => {
        console.error('Fetch error:', error);
        return null;
      });
    const { strokes: recordedBrushStrokes } = historyFile;
    if (!recordedBrushStrokes) {
      console.warn(`Could not load stroke history from replayable comment ${comment}`);
      return;
    }
    this.player.loadHistory(recordedBrushStrokes);
    this.player.show();
    this.player.playback(100, onPlaybackEnd);
  }

  pickNextPlayedElement(retriesForNewElement = 3) {
    const playableElements = [...this.visibleComments];
    if (playableElements.length === 0) return null;
    if (playableElements.length === 1) return playableElements[0];
    let candidate = null;
    for (let i = 0; i < retriesForNewElement; i++) {
      const candidateIndex = Math.floor(Math.random() * playableElements.length);
      candidate = playableElements[candidateIndex];
      if (candidate !== this.lastPlayedElement) return candidate;
    }
    return this.lastPlayedElement ?? candidate;
  }

  scheduleNextPlayCheck() {
    this.scheduleTimer = setTimeout(() => this.checkAndPlay(), this.intervalPause);
  }

  checkAndPlay() {
    if (this.isPlaying) return;
    if (this.visibleComments.size === 0) {
      this.scheduleNextPlayCheck();
      return;
    }
    const upNextComment = this.pickNextPlayedElement();
    if (!upNextComment) {
      this.scheduleNextPlayCheck();
      return;
    }
    this.isPlaying = true;
    this.lastPlayedElement = upNextComment;
    clearTimeout(this.scheduleTimer);
    this.playReplayableComment(upNextComment, () => {
      this.isPlaying = false;
      this.scheduleNextPlayCheck();
    });
  }
}

export async function setupCommentManager() {
  const drawerConfig = {
    width: 320,
    height: 120,
    scale: 1,
    version: 1,
  };
  // The drawer is where users can actually draw comments and submit them to the server.
  setupCommentDrawer(drawerConfig);
  // The player is exclusively for replaying a brush history and cannot be interacted with.
  // It is essentially a comment drawer that does not accept any input or output, merely running its brush engine.
  setupCommentPlayer(drawerConfig);
}
