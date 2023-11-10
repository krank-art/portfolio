export function setupBlogNav() {
  const blogNav = document.getElementById("blog-nav");
  if (!blogNav) return;
  
  // Scroll active item into view
  const scrollContainer = blogNav.querySelector('.blog-nav-body');
  const activeItem = blogNav.querySelector('.page-list-item-active');
  const containerRect = scrollContainer.getBoundingClientRect();
  const activeItemRect = activeItem.getBoundingClientRect();
  const offset = activeItemRect.top - containerRect.top - (containerRect.height - activeItemRect.height) / 2;
  scrollContainer.scrollTop += offset;

  // Setup expander
  const expander = blogNav.querySelector(".blog-nav-expander");
  expander.addEventListener("click", (event) => {
    event.preventDefault();
    blogNav.classList.toggle("expanded");
  });
}
