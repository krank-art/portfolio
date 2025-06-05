import { showCommentDialog } from "./comment-confirmer";
import CommentDrawer from "./comment-drawer";

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
  const commentDrawer = new CommentDrawer({
    width: 320,
    height: 120,
    scale: 1,
    container: container,
    onSubmit: (image, inputRecords) => showCommentDialog({
      // TODO: Save input records on server
      drawnImageBase64: image,
      commentedPicPath: commentedPic ? getImageSrcsetPath(commentedPic, "/480p/") : null,
      commentedPicAlt: commentedPic ? commentedPic.alt : null,
      secret: "mySecret",
      target: location.pathname,
    }),
  });
}
