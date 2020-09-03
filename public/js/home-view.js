import map from "./map.js";
import bannerNotice from "./banner-notice.js";
import editSelect from "./edit-select.js";
import blogPosts from "./blog-posts.js";

const toArray = nodeList => Array.prototype.slice.call(nodeList);

document.addEventListener("DOMContentLoaded", () => {
  map.init();
  editSelect.init();
  blogPosts.init();
  initSearchForm();
});

function initSearchForm() {
  const searchFormEl = document.querySelector(".js-home-hero-search__form");
  searchFormEl.addEventListener("submit", e => {
    e.preventDefault();
    const selectEl = searchFormEl.querySelector(
      "#js-home-hero-search__edit-select"
    );
    const category = selectEl.options[selectEl.selectedIndex].value;
    const query = searchFormEl.querySelector(".js-home-hero-search__form-input")
      .value;

    let searchUrl = "/search";
    if (category) {
      searchUrl = `${searchUrl}?selectedCategory=${category}`;
    }
    if (category && query) {
      searchUrl = `${searchUrl}&query=${query}`;
    } else if (query) {
      searchUrl = `${searchUrl}?query=${query}`;
    }

    location.href = searchUrl;
  });
}
