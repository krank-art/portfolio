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

/**
 * @param {CommentDrawer} player 
 * @param {HTMLElement} comment 
 */
async function playReplayableComment(player, comment) {
  player.attachToElement(comment);
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
  const {strokes: recordedBrushStrokes} = historyFile;
  if (!recordedBrushStrokes) {
    console.warn(`Could not load stroke history from replayable comment ${comment}`);
    return;
  }
  player.loadHistory(recordedBrushStrokes);
  player.playback(100);
}

export async function setupCommentPlayer({ width, height, scale, target }) {
  const commentPlayer = new CommentDrawer({
    width: width,
    height: height,
    scale: scale,
    container: null,
    mode: "player",
  });

  const visibleComments = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        visibleComments.add(entry.target);
        playReplayableComment(commentPlayer, entry.target);
      } else {
        visibleComments.delete(entry.target);
      }
    });
  }, { threshold: 0 });
  document.querySelectorAll('.comment-replayable').forEach(el => observer.observe(el));

  
  /*
  const replayableComments = Array.from(target.querySelectorAll(".comment-replayable"));
  const commentPlayers = [];
  for (const comment of replayableComments) {

    const playbackRepeatRaw = comment.dataset.playbackRepeat;
    const playbackRepeat = playbackRepeatRaw && playbackRepeatRaw !== "false" ? parseInt(playbackRepeatRaw) : false;
    const playbackGroup = comment.dataset.playbackGroup;
    
    commentPlayers.push({
      player: commentPlayer,
      repeat: playbackRepeat,
      group: playbackGroup,
    });
  }
    */
}

/*
function setupAnimationForCommentPlayers(commentPlayers, playbackSpeed = 100) {
  const animationGroups = {};
  for (const commentPlayer of commentPlayers) {
    const { player, repeat, group } = commentPlayer;
    if (group) {
      if (animationGroups[group])
        animationGroups[group].push(commentPlayer)
      else
        animationGroups[group] = [commentPlayer];
      continue;
    }
    if (repeat) {
      playbackLoop(commentPlayer, repeat);
      continue;
    }
    commentPlayer.playback(playbackSpeed);
  }
  for (const groupName in animationGroups) {
    const animationGroup = animationGroups[groupName];
    const indices = animationGroup.length;
    const animationPool = [...indices].sort(() => Math.random() - 0.5); // Use Fisher–Yates shuffle if needed
    while (animationPool.length > 0) {
      
    }
  }
}

function playbackLoop(commentPlayer, waitBetween) {
  commentPlayer.playback(playbackSpeed, () => {
    setTimeout(() => {
      playbackLoop(commentPlayer, waitBetween);
    }, waitBetween)
  });
}
*/

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
  await setupCommentPlayer({ ...drawerConfig, target: document });
}
