import { showCommentDialog } from "./comment-confirmer";
import CommentDrawer from "./comment-drawer";
import { encodeCommentHistory } from "./comment-file";

function getImageSrcsetPath(imageElement, searchedPath) {
  const srcset = imageElement.getAttribute('srcset');
  if (!srcset) return null;
  const entries = srcset.split(',').map(entry => entry.trim().split(' ')[0]);
  const match = entries.find(src => src.includes(searchedPath));
  return match ?? null;
}

export function setupCommentManager() {
  const container = document.getElementById("comment-drawer");
  if (!container) return;
  const commentedPic = document.querySelector(".gallery-image");
  const width = 320;
  const height = 120;
  const commentDrawer = new CommentDrawer({
    width: width,
    height: height,
    scale: 1,
    container: container,
    onSubmit: (image, inputRecords) => {
      const commentHistoryBytes = encodeCommentHistory({ 
        version: 1, 
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
