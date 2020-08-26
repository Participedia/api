import {
  getValueForParam,
  updateUrlParams,
  removeUrlParams,
} from "./utils/utils.js";
import searchFilterModal from "./search-filter-modal.js";

const tabsWithCards = {
  init() {
    this.tabInputEls = Array.prototype.slice.call(
      document.querySelectorAll(".js-tab-container input[name='tabs']")
    );
    this.viewEl = document.querySelector("[data-card-layout]");

    if (this.tabInputEls.length === 0) return;

    // tabs ui
    this.initDesktopTabNav();
    this.initMobileTabNav();

    if (!this.viewEl) return;
    // cards ui
    this.initCardLayout();
    this.initPagination();

    // More Filters Button
    const moreFilterBtnEl = document.querySelector(".js-tab-buttons-button-filter");
    moreFilterBtnEl.addEventListener("click", event => {
      this.openMoreFilterModal();
    });;
  },

  navigateToTab(category) {
    const query = getValueForParam("query");
    let url = `${window.location.origin +
      window.location.pathname}?selectedCategory=${category}`;

    if (query) {
      url = `${url}&query=${query}`;
    }

    window.location.href = url;
  },

  initDesktopTabNav() {
    // update url param to indicate current tab
    this.tabInputEls.forEach(el => {
      el.addEventListener("click", event => {
        this.navigateToTab(event.target.id);
      });
    });
  },

  initMobileTabNav() {
    const selectEl = document.querySelector(".js-tab-select-container select");

    if (!selectEl) return;

    // select current tab
    const optionEls = Array.prototype.slice.call(
      selectEl.querySelectorAll("option")
    );
    const currentTab = this.tabInputEls.find(el => el.checked);
    optionEls.forEach(el => (el.selected = el.value === currentTab.id));

    // event listener for select change
    selectEl.addEventListener("change", event => {
      // change tab to selected type
      const newTabId = event.target.value;
      // toggle checked attr on inputs
      this.tabInputEls.forEach(el => (el.checked = el.id === newTabId));
      // go to new tab
      this.navigateToTab(newTabId);
    });
  },

  initPagination() {
    const paginationNavEls = Array.prototype.slice.call(
      this.viewEl.querySelectorAll(".js-pagination-nav")
    );

    paginationNavEls.forEach(el => {
      el.addEventListener("click", event => {
        event.preventDefault();
        const link = event.target.closest("a");
        if (link) {
          updateUrlParams("page", link.getAttribute("data-page-num"));
          window.location.href = window.location.href;
        }
      });
    });
  },

  initCardLayout() {
    const toggleLayoutBtnsEl = this.viewEl.querySelector(
      ".js-card-layout-btns"
    );

    // event listeners for grid/list toggle buttons
    toggleLayoutBtnsEl.addEventListener("click", event => {
      const btnEl = event.target.closest("button");

      if (btnEl) {
        const type = btnEl.getAttribute("data-type");
        if (!type) return;
        updateUrlParams("layout", type);
        this.viewEl.setAttribute("data-card-layout", type);
      }
    });
  },

  openMoreFilterModal() {
    searchFilterModal.openModal("search-filter-modal");
  },
};

export default tabsWithCards;
