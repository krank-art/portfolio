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

async function setupCommentPlayer({ width, height, scale, version }) {
  const replayableComments = Array.from(document.querySelectorAll(".comment-replayable"));
  for (const comment of replayableComments) {
    const historyFileSrc = comment.dataset.historySrc;
    if (!historyFileSrc) {
      console.warn(`Missing attribute 'data-history-src' on replayable comment ${comment}`);
      continue;
    }
    const playbackRepeatRaw = comment.dataset.playbackRepeat;
    const playbackRepeat = playbackRepeatRaw && playbackRepeatRaw !== "false" ? parseInt(playbackRepeatRaw) : false;
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
    const strokeHistory = historyFile?.strokes;
    if (!strokeHistory) {
      console.warn(`Could not load stroke history from replayable comment ${comment}`);
      continue;
    }
    const commentPlayer = new CommentDrawer({
      width: width,
      height: height,
      scale: scale,
      container: comment,
      preloadedInputs: strokeHistory,
      mode: "player",
    });
    const onEnd = !playbackRepeat ? null :
      commentPlayer.playback(100);

    const playbackSpeed = 100;
    // TODO: Only START playback when actually in view or better yet, implement a conductor that cycles
    // through a set of VISIBLE comments and plays their animation. This is so we do not overload the client
    // with lots of canvas drawing calls.
    const playbackLoop = (waitBetween) => 
      commentPlayer.playback(playbackSpeed, () => {setTimeout(() => { playbackLoop(waitBetween); }, waitBetween)});
    if (playbackRepeat)
      playbackLoop(playbackRepeat);
    else
      commentPlayer.playback(playbackSpeed);
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
  await setupCommentPlayer(drawerConfig);
}
