import "../style/main.scss";
import { setupBlogNav } from "./blog-nav";
import { setupFilterList } from "./filter-list";
import { setupGallery } from "./gallery";
import { setupImageDecoder } from "./image-decoder";
import { setupItemCarousels } from "./item-carousel";
import { setupMultiButtons } from "./multi-button";
import { setupClickableTags } from "./tag-doc";
import { setupViewSwitchers } from "./view-switcher";

setupGallery();
//setupBlogNav();
setupFilterList();
setupMultiButtons();
setupViewSwitchers();
setupItemCarousels();
setupClickableTags();
(async () => { await setupImageDecoder() })();
