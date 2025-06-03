import "../style/main.scss";
import { setupBlogNav } from "./blog-nav";
import { setupFilterList } from "./filter-list";
import { setupGallery } from "./gallery";
import { setupImageDecoder } from "./image-decoder";
import { setupItemCarousels } from "./item-carousel";
import { setupMultiButtons } from "./multi-button";
import { setupClickableTags } from "./tag-doc";
import { setupViewSwitchers } from "./view-switcher";
import { setupCommentList } from "./comment-list";
import { setupCommentDrawer } from "./comment-drawer";

const { sidebar } = setupGallery();
//setupBlogNav();
setupFilterList();
setupMultiButtons();
setupViewSwitchers();
setupItemCarousels();
setupClickableTags();
setupCommentDrawer();
(async () => { await setupImageDecoder() })();
if (sidebar)
  (async () => { await setupCommentList({ sidebar }) })();
