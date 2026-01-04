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
  const commentPlayer = new CommentPlayer({ width, height, scale, intervalPause });
  commentPlayer.startScheduler();
}

class CommentPlayer {
  /** @type {CommentDrawer} */        player;
  /** @type {Set<HTMLElement>} */     visibleComments = new Set();
  /** @type {HTMLElement} */          lastPlayedElement = null;
  /** @type {number} */               scheduleTimer = null;
  /** @type {boolean} */              isPlaying = false;
  /** @type {boolean} */              isHalting = false;
  /** @type {number} */               intervalPause;
  /** @type {IntersectionObserver} */ observer;
  /** @type {LRUArrayBufferCache} */  historyCache;

  constructor({ width, height, scale, intervalPause = 3000 }) {
    this.player = new CommentDrawer({
      width: width,
      height: height,
      scale: scale,
      container: null,
      mode: "player",
    });
    this.intervalPause = intervalPause;
    // Comment history files are on average 1 KB, so with this we could store up to 2048 brush histories before
    // we need to throw out old brush histories and refetch them from the server.
    this.historyCache = new LRUArrayBufferCache(2 * 1024 * 1024);
    this.setupIntersectionObserver();
    this.setupPageVisibility();
  }

  startScheduler() {
    this.resumeScheduler();
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

  setupPageVisibility() {
    // This only seems to work when the users changes the tab in the current browser.
    // If the window goes inactive in Ubuntu (but the current tab is still in front), then the animation keeps playing.
    // Makes sense, because even if the window has no focus, the user likely wants the browser to keep going.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.haltScheduler();
        return;
      }
      this.resumeScheduler();
    });
  }

  async getHistoryFile(historyFileSrc) {
    if (this.historyCache.has(historyFileSrc)) {
      const cached = this.historyCache.get(historyFileSrc);
      //console.log(`Cache hit: ${cached.size} bytes`);
      return cached.buffer;
    }
    const historyFile = await fetch(historyFileSrc)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.arrayBuffer();
      })
      .catch(error => {
        console.error('Fetch error:', error);
        return null;
      });
    this.historyCache.set(historyFileSrc, historyFile);
    return historyFile;
  }

  /**
   * @param {HTMLElement} comment 
   */
  async playReplayableComment(comment, onPlaybackEnd = () => { }) {
    // We need to hide while switching comments, otherwise there is a flash of the previously comment on the new one.
    this.player.hide();
    this.player.attachToElement(comment);
    const historyFileSrc = comment.dataset.historySrc;
    if (!historyFileSrc) {
      console.warn(`Missing attribute 'data-history-src' on replayable comment ${comment}`);
      return;
    }
    const historyFileRaw = await this.getHistoryFile(historyFileSrc);
    const historyFile = decodeCommentHistory(historyFileRaw);
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

  haltScheduler() {
    // This does not stop playback immediately. Instead it will finish the currently running playback and then stop.
    this.isHalting = true;
    clearTimeout(this.scheduleTimer);
  }

  resumeScheduler() {
    this.isHalting = false;
    this.scheduleTimer = setTimeout(() => this.checkAndPlay(), this.intervalPause);
  }

  checkAndPlay() {
    if (this.isPlaying) return;
    if (this.visibleComments.size === 0) {
      this.resumeScheduler();
      return;
    }
    const upNextComment = this.pickNextPlayedElement();
    if (!upNextComment) {
      this.resumeScheduler();
      return;
    }
    this.isPlaying = true;
    this.lastPlayedElement = upNextComment;
    // This suspends the timer, its not the same as "halting". 
    // With "halting" we signify that we want to stop at the next possible moment.
    clearTimeout(this.scheduleTimer);
    this.playReplayableComment(upNextComment, () => {
      //console.log(new Date(), `plays comment in ${this.intervalPause}ms`);
      this.isPlaying = false;
      // resume scheduler if no upcoming halt
      if (!this.isHalting)
        this.resumeScheduler();
    });
  }
}
/**
 * Least-Recently-Used Cache for ArrayBuffers
 */
class LRUArrayBufferCache {
  constructor(maxBytes = 2 * 1024 * 1024) {
    /** @type {Map<string, { buffer: ArrayBuffer, size: number }>} */
    this.cache = new Map();
    this.maxBytes = maxBytes;
    this.currentBytes = 0;
  }

  get(url) {
    const entry = this.cache.get(url);
    if (!entry) return null;
    // Move to the end (most recently used)
    this.cache.delete(url);
    this.cache.set(url, entry);
    return entry;
  }

  set(url, buffer) {
    const size = buffer.byteLength;
    // If already in cache, remove old entry to update position
    if (this.cache.has(url)) {
      const old = this.cache.get(url);
      this.currentBytes -= old.size;
      this.cache.delete(url);
    }
    const iterationLimit = 10000;
    let iterationCounter = 0;
    // Evict least recently used entries if needed
    while (this.currentBytes + size > this.maxBytes && this.cache.size > 0) {
      // oldest entry is first in Map iteration
      const oldestKey = this.cache.keys().next().value;
      const oldest = this.cache.get(oldestKey);
      this.currentBytes -= oldest.size;
      this.cache.delete(oldestKey);
      if (++iterationCounter <= iterationLimit) continue;
      console.warn(`Exceeded array buffer cache cleanup while iterations`);
      break;
    }
    this.cache.set(url, { buffer, size });
    this.currentBytes += size;
  }

  has(url) {
    return this.cache.has(url);
  }

  clear() {
    this.cache.clear();
    this.currentBytes = 0;
  }

  size() {
    return this.currentBytes;
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
