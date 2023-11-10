export function setupBlogNav() {
  const blogNav = document.getElementById("blog-nav");
  if (!blogNav) return;
  const expander = blogNav.querySelector(".blog-nav-expander");
  expander.addEventListener("click", (event) => {
    event.preventDefault();
    blogNav.classList.toggle("expanded");
  });
}
