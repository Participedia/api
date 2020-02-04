import moment from "moment";
import mapStyle from "./map-style.js";
import PopOver from "./GoogleMapsPopOver.js";
import { xhrReq } from "./utils/utils.js";
import tracking from "./utils/tracking.js";

const defaultMarkerIcon = "/images/default-marker.svg";
const featuredMarkerIcon = "/images/featured-marker.svg";

const map = {
  init() {
    const mapEl = document.querySelector(".js-map-inner");
    const isMethodTab = document.getElementById("method").checked;

    if (!mapEl) return;

    this.map = new google.maps.Map(mapEl, {
      center: { lat: 6.1259722, lng: 20.9404108 },
      zoom: this.mapZoomLevel(),
      disableDefaultUI: true,
      zoomControl: false,
      styles: mapStyle,
    });

    this.initZoomControls(this.map);

    if (!isMethodTab) {
      // don't fetch results if we are on the methods tab
      this.fetchMapResults();
    }
  },

  mapZoomLevel () {
    if (window.innerWidth > 1200) {
      return 2.5;
    } else if (window.innerWidth < 1200 && window.innerWidth > 800) {
      return 2;
    } else if (window.innerWidth < 800) {
      return 1.75;
    }
  },

  initMapOverlay() {
    const mapOverlayTriggerEl = document.querySelector(
      ".js-map-overlay-trigger"
    );

    this.mapControls = document.querySelector(".js-map-controls");
    this.mapOverlayEl = document.querySelector(".js-map-overlay");
    this.mapLegend = document.querySelector(".js-map-legend");

    this.mapOverlayEl.addEventListener("click", e => {
      try {
        window.sessionStorage.setItem("participedia:mapActivated", "true");
      } catch (err) {
        console.warn(err);
      }
      this.hideMapOverlay();
    });

    mapOverlayTriggerEl.addEventListener("click", e => {
      // track activate map click
      tracking.send("home.map", "activate_map_button_click");
      this.showMapOverlay();
    });

    // if user has already clicked to activate map in the current browser session,
    // don't show overlay, show legend
    if (window.sessionStorage.getItem("participedia:mapActivated")) {
      this.hideMapOverlay();
    } else {
      this.showMapOverlay();
    }

    this.initTracking();
  },

  initTracking() {
    // track join now button click in map overlay
    const joinNowButtonEl = document.querySelector(".js-join-now-button");
    if (joinNowButtonEl) {
      joinNowButtonEl.addEventListener("click", event => {
        event.preventDefault();
        tracking.sendWithCallback(
          "home.map",
          "join_now_button_click",
          "",
          () => {
            window.location.href = event.target.href;
          }
        );
      });
    }
  },

  showMapOverlay() {
    this.closePopOver();
    this.mapOverlayEl.style.display = "block";
    this.mapLegend.style.display = "none";
    this.mapControls.style.display = "none";
  },

  hideMapOverlay() {
    this.mapOverlayEl.style.display = "none";
    this.mapLegend.style.display = "flex";
    this.mapControls.style.display = "block";
  },

  initZoomControls(map) {
    document
      .querySelector(".js-map-zoom-control-in")
      .addEventListener("click", () => {
        map.setZoom(map.getZoom() + 1);
      });
    document
      .querySelector(".js-map-zoom-control-out")
      .addEventListener("click", () => {
        map.setZoom(map.getZoom() - 1);
      });
    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(
      document.querySelector(".js-map-controls")
    );
  },

  fetchMapResults() {
    let url = "";
    if (window.location.search) {
      url = `/${window.location.search}&resultType=map&returns=json`;
    } else {
      url = `/?resultType=map&returns=json`;
    }

    const successCB = response => {
      const results = JSON.parse(response.response).results;
      this.cacheResults(response.responseURL, results);
      this.renderMarkers(results);
    };
    const errorCB = response => {
      //console.log("err", response)
    };

    const cachedResults = this.getCachedResults(window.location.origin + url);
    if (cachedResults) {
      // if we have cached results, render the markers with those
      this.renderMarkers(cachedResults);
    } else {
      // if we don't have cached results, make the request
      xhrReq("GET", url, {}, successCB, errorCB);
    }
  },

  cacheResults(key, results) {
    // save to session storage
    const data = {
      updatedAt: Date.now(),
      results: results,
    };
    try {
      window.sessionStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn(err);
    }
  },

  getCachedResults(key) {
    const CACHE_TIMEOUT = Date.now() - 300000; // 5mins === 300000ms
    const data = window.sessionStorage.getItem(key);

    if (!data) return null;
    const { updatedAt, results } = JSON.parse(data);
    if (updatedAt < CACHE_TIMEOUT) {
      return null;
    } else {
      return results;
    }
  },

  filterResultsForTab(results) {
    const currentTab = document.querySelector(".js-tab-container input:checked")
      .id;
    if (currentTab === "organizations") {
      // NOTE: currentTab for organizations is plural, but article type is singular
      // organizations only
      return results.filter(article => article.type === "organization");
    } else if (currentTab === "case") {
      // cases only
      return results.filter(article => article.type === "case");
    } else if (currentTab === "all") {
      // cases and orgs
      return results.filter(
        article => article.type === "case" || article.type === "organization"
      );
    } else if (currentTab === "method") {
      // none for methods
      return null;
    }
  },

  closePopOver() {
    const openMarker = document.querySelector(".js-pop-over");
    if (openMarker) {
      openMarker.parentNode.removeChild(openMarker);
    }
  },

  dropMarkers(markers) {
    // use setTimeout to animate the markers appearing on screen
    for (let i = 0; i < markers.length; i++) {
      setTimeout(() => {
        this.createMarker(markers[i]);
      }, i * 5);
    }
  },

  createMarker(marker) {
    const markerPopOver = new google.maps.Marker({
      position: marker.position,
      map: this.map,
      icon: marker.featured === true ? featuredMarkerIcon : defaultMarkerIcon,
    });
    this.bindClickEventForMarker(markerPopOver, marker);
  },

  renderMarkers(results) {
    const articleCardsContainer = document.querySelector(".js-cards-container");
    const filteredResults = this.filterResultsForTab(results);

    const markers = filteredResults
      .map(article => {
        const { latitude, longitude } = article;

        // if article doesn't have lat,lng coords, don't render markers
        if (!latitude || !longitude || !articleCardsContainer) return;

        return {
          id: article.id,
          type: article.type,
          photo: article.photos && article.photos[0].url,
          submittedDate: article.post_date,
          title: article.title,
          featured: article.featured,
          position: new google.maps.LatLng(latitude, longitude),
          content: articleCardsContainer.querySelector("li"),
        };
      })
      .filter(m => m !== undefined);

    // render markers
    this.dropMarkers(markers);
    this.initMapOverlay();
  },

  bindClickEventForMarker(markerEl, marker) {
    // on marker click, show article card in popover on map
    markerEl.addListener("click", event => {
      const popOverContentEl = document.createElement("div");
      // get card content from marker and set on content element
      popOverContentEl.classList = "article-card";
      popOverContentEl.innerHTML = marker.content.innerHTML;

      // update type
      const articleTypeEl = popOverContentEl.querySelector(
        ".js-article-card-meta h5"
      );

      if (marker.featured) {
        articleTypeEl.innerHTML = marker.content.getAttribute(
          `data-i18n-featured-${marker.type}`
        );
      } else {
        articleTypeEl.innerHTML = marker.content.getAttribute(
          `data-i18n-${marker.type}`
        );
      }

      // update image
      const articleImageEl = popOverContentEl.querySelector(
        ".js-article-card-img"
      );
      articleImageEl.style.backgroundImage = `url("${marker.photo}")`;

      // update title & truncate to 45 chars
      const articleTitleEl = popOverContentEl.querySelector(
        ".js-article-card-title"
      );
      if (marker.title.length < 50) {
        articleTitleEl.innerText = marker.title;
      } else {
        articleTitleEl.innerText = marker.title.substring(0, 40) + "...";
      }

      // update submitted at
      const articleSubmittedDate = popOverContentEl.querySelector(
        ".js-article-date"
      );
      articleSubmittedDate.innerHTML = moment(marker.submittedDate).format(
        "MMMM M, YYYY"
      );

      // update links
      const articleLinks = Array.prototype.slice.call(
        popOverContentEl.querySelectorAll(".js-article-link")
      );
      articleLinks.forEach(el => {
        el.setAttribute("href", `/${marker.type}/${marker.id}`);
      });

      // if there is already a current pop over, remove it
      if (this.popOver) {
        this.popOver.setMap(null);
      }

      // insert pop over
      this.popOver = new PopOver(marker.position, popOverContentEl);
      this.popOver.setMap(this.map);

      // on screen widths less than 1100 the legend overlaps the marker card,
      // so in this case, hide the legend when the marker is shown
      if (window.innerWidth < 1100) {
        this.mapLegend.style.display = "none";
      }

      // remove pop over on close button click
      this.popOver.anchor.addEventListener("click", event => {
        const closeButtonEl = event.target.closest(".js-close-card-btn");
        if (!closeButtonEl) return;
        this.popOver.setMap(null);
        // show legend when marker is closed
        this.mapLegend.style.display = "flex";
      });
    });
  },
};

export default map;
