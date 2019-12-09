const fs = require("fs");
const moment = require("moment");
const md5 = require("js-md5");
const aboutData = require("./data/about-data.js");
const socialTagsTemplate = require("./social-tags-template.js");
const sharedFieldOptions = require("./shared-field-options.js");
const searchFiltersList = require("./search-filters-list.js");
const countries = require("./countries.js");
const { SUPPORTED_LANGUAGES } = require("../../constants.js");

const LOCATION_FIELD_NAMES = [
  "address1",
  "address2",
  "city",
  "province",
  "postal_code",
  "country",
  "latitude",
  "longitude"
];

function setMomentLocale(context) {
  const req = context.data.root.req;
  const locale = req.cookies.locale;
  if (locale) {
    moment.locale(locale);
  }
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

function mapIdTitleToKeyValue(options) {
  if (!options) return null;
  return options.map(item => {
    return {
      key: item.id,
      value: item.title
    };
  });
}

function currentUrl(req) {
  const path = req.originalUrl;
  const host = req.headers.host;
  return `https://${host}${path}`;
}

function getFirstPhotoUrl(article) {
  if (!article.photos) return;
  if (article.photos.length === 0) return;
  return article.photos[0].url;
}

function getPageTitle(req, article, context) {
  const path = req.route && req.route.path;
  const is404 = context.data.exphbs.view === "404";

  const titleByPath = {
    "/": "Participedia",
    "/about": i18n("About", context) + " – Participedia",
    "/teaching": i18n("Teaching", context) + " – Participedia",
    "/research": i18n("Research", context) + " – Participedia",
    "/404": i18n("Sorry, this page cannot be found", context) + " – Participedia",
  };
  if (article && article.title) {
    return article.title + " – Participedia";
  } else if (titleByPath[path]) {
    return titleByPath[path];
  } else if (is404) {
    return titleByPath["/404"];
  } else {
    return titleByPath["/"];
  }
};

const i18n = (key, context) =>
  context && context.data && context.data.root.__(key);

module.exports = {
  // transalation helpers
  getLocalizedTermsOfUsePartial: (context) => {
    const locale = context.data.root.locale || "en";
    return `terms-of-use-${locale}`;
  },

  searchFilterLabel: (type, name, context) => {
    const view = context.data.root.params.view;
    return i18n(`${type}_${view}_${name}_label`, context);
  },

  label: (article, name, context) => {
    const view = context.data.root.params.view;
    return i18n(`${article.type}_${view}_${name}_label`, context);
  },

  hasInfo: (article, name, context) => {
    const view = context.data.root.params.view;
    const key = `${article.type}_${view}_${name}_info`;
    const i18nValue = i18n(key, context);
    return i18nValue !== key;
  },

  info: (article, name, context) => {
    const view = context.data.root.params.view;
    return i18n(`${article.type}_${view}_${name}_info`, context);
  },

  hasInstructional: (article, name, context) => {
    const view = context.data.root.params.view;
    const key = `${article.type}_${view}_${name}_instructional`;
    const i18nValue = i18n(key, context);
    return i18nValue !== key;
  },

  instructional: (article, name, context) => {
    const view = context.data.root.params.view;
    return i18n(`${article.type}_${view}_${name}_instructional`, context);
  },

  placeholder: (article, name, context) => {
    const view = context.data.root.params.view;
    return i18n(`${article.type}_${view}_${name}_placeholder`, context);
  },

  t: (key, context) => i18n(key, context),

  getLocale(context) {
    const req = context.data.root.req;
    if (req.cookies.locale) {
      return req.cookies.locale;
    } else {
      return "en";
    }
  },

  getLanguageOptions: () => {
    return SUPPORTED_LANGUAGES;
  },

  getOriginalLanguage: (article, context) => {
    const req = context.data.root.req;
    return article.original_language || req.cookies.locale || "en";
  },

  isSelectedLanguage: (lang, context) => {
    const req = context.data.root.req;
    return lang === req.cookies.locale;
  },

  getArticleOptions: (staticText, name) => {
    // has_components and is_component_of fields use the cases options
    // uses mapIdTitleToKeyValue function to map id/title keys to key/value keys
    if (name === "is_component_of") {
      return mapIdTitleToKeyValue(staticText["cases"]);
    } else if (name === "specific_methods_tools_techniques") {
      return mapIdTitleToKeyValue(staticText["methods"]);
    } else if (name === "primary_organizer") {
      return mapIdTitleToKeyValue(staticText["organizations"]);
    } else {
      return staticText[name];
    }
  },

  linkSetPlaceholder: (article, name, attr, context) => {
    const view = context.data.root.params.view;
    return i18n(`${article.type}_${view}_${name}_${attr}_placeholder`, context);
  },

  linkSetLabel: (article, name, attr, context) => {
    const view = context.data.root.params.view;
    return i18n(`${article.type}_${view}_${name}_${attr}_label`, context);
  },

  linkSetInstructional: (article, name, attr, context) => {
    const view = context.data.root.params.view;
    return i18n(
      `${article.type}_${view}_${name}_${attr}_instructional`,
      context
    );
  },

  i18nEditFieldValue: (name, option, context) => {
    const defaultKey = `name:${name}-key:${option}`;
    const longKey = `${defaultKey}-longValue`;
    const i18nValue = i18n(defaultKey, context);
    const i18nLongValue = i18n(longKey, context);

    const fieldNamesMappedToListOfArticles = {
      is_component_of: "cases",
      specific_methods_tools_techniques: "methods",
      primary_organizer: "organizations"
    };

    // if the name is one that maps to list of articles return that value
    if (Object.keys(fieldNamesMappedToListOfArticles).includes(name)) {
      const articleType = fieldNamesMappedToListOfArticles[name];
      const options = context.data.root.static[articleType];
      return option.value;
    }

    // if there is a longValue, return that
    // otherwise return the default value
    else if (i18nLongValue !== longKey) {
      return i18nLongValue;
    } else {
      return i18nValue;
    }
  },

  // article helpers
  shouldShowCompletenessPrompt: (article) => {
    if (article.completeness && article.completeness !== 'complete') {
      return true;
    } else {
      return false;
    }
  },

  getCompletenessPrompt: (article) => {
    if (!article.completeness || article.completeness === 'complete') return;

    const articleEditLink = `/${article.type}/${article.id}/edit?full=1`;

    const promptsByStatus = {
      stub: `<strong>The following entry is a stub.</strong> Please help us <a href="${articleEditLink}">complete it</a>.`,
      partial_content: `<strong>The following entry is incomplete.</strong> You can help Participedia by <a href="${articleEditLink}">adding to it</a>.`,
      partial_citations: `<strong>The following entry is missing citations.</strong> Please help us <a href="${articleEditLink}">verify its content</a>.`,
      partial_editing: `<strong>The following entry needs assistance with content and editing.</strong> Please help us <a href="${articleEditLink}">complete it</a>.`,
    };

    return promptsByStatus[article.completeness];
  },

  getCompletenessModalHeader: (article) => {
    if (!article.completeness || article.completeness === 'complete') return;

    const headerByStatus = {
      stub: 'Stub',
      partial_content: 'Partial',
      partial_citations: 'Citations/Footnotes Needed',
      partial_editing: 'Grammar/Spelling Edits Needed',
    };

    return headerByStatus[article.completeness];
  },

  getCompletenessModalText: (article) => {
    if (!article.completeness || article.completeness === 'complete') return;

    const stubText = `
      <p>Stub entries contain little information beyond a title, providing ideal starting places for students and anyone interested in contributing to Participedia. More stub entries can be found using the “entry completeness” search filter on the homepage.</p>

      <p>An entry’s level of completeness is manually assigned by our editing team. Complete entries contain most of the data requested in the entry form, include at least three sections of the written narrative using citations (footnotes), and require no significant corrections to their grammar or spelling. If you complete an entry, please email <a href="mailto:communications@participedia.net">communications@participedia.net</a> to request a review so it can be correctly labelled.</p>

      <p>Please read our <a href='https://docs.google.com/document/d/19Pc9qL3H1SxSByuQY1HxLOgbbMQpnnxlicdMGuC78Wg/edit' target='_blank'>guidelines</a> on how to write an entry or contact us for more information.</p>
    `;

    const partialContentText = `
      <p>Partial entries are about half complete, and make good starting places for students and anyone interested in contributing to Participedia. More partial entries can be found using the “entry completeness” search filter on the homepage.</p>

      <p>An entry’s level of completeness is manually assigned by our editing team. Complete entries contain most of the data requested in the entry form, include at least three sections of the written narrative using citations (footnotes), and require no significant corrections to their grammar or spelling. If you complete an entry, please email <a href="mailto:communications@participedia.net">communications@participedia.net</a> to request a review so it can be correctly labelled.</p>

      <p>Please read our <a href='https://docs.google.com/document/d/19Pc9qL3H1SxSByuQY1HxLOgbbMQpnnxlicdMGuC78Wg/edit' target='_blank'>guidelines</a> on how to write an entry or contact us for more information.</p>
    `;

    const partialCitationsText = `
      <p>This type of entry is missing citations (footnotes), but is otherwise complete. Entries needing citations can be identified using the “entry completeness” search filter on the homepage.</p>

      <p>An entry’s level of completeness is manually assigned by our editing team. Complete entries contain most of the data requested in the entry form, include at least three sections of the written narrative using citations (footnotes), and require no significant corrections to their grammar or spelling. If you complete an entry, please email <a href="mailto:communications@participedia.net">communications@participedia.net</a> to request a review so it can be correctly labelled.</p>

      <p>Please read our <a href='https://docs.google.com/document/d/19Pc9qL3H1SxSByuQY1HxLOgbbMQpnnxlicdMGuC78Wg/edit' target='_blank'>guidelines</a> on how to write an entry or contact us for more information.</p>
    `;

    const partialEditingText = `
      <p>This type of entry needs significant improvements to its grammar or spelling, and can be any level of completeness (stub, partial, or complete). Entries needing grammar or spelling edits can be identified using the “entry completeness” search filter on the homepage.</p>

      <p>Completeness status is manually assigned by our editing team. Complete entries contain most of the data requested in the entry form, including at least three sections of the written narrative with citations (footnotes), and require no significant grammar or spelling edits. If you complete an entry, please email <a href="mailto:communications@participedia.net">communications@participedia.net</a> to request a review so it can be correctly labelled.</p>

      <p>Please read our <a href='https://docs.google.com/document/d/19Pc9qL3H1SxSByuQY1HxLOgbbMQpnnxlicdMGuC78Wg/edit' target='_blank'>guidelines</a> on how to write an entry or contact us for more information.</p>
    `;

    const textByStatus = {
      stub: stubText,
      partial_content: partialContentText,
      partial_citations: partialCitationsText,
      partial_editing: partialEditingText,
    };

    return textByStatus[article.completeness];
  },

  isLinkableTerm: (article, name) => {
    const supportedArticleTypes = ["case"];

    if (!supportedArticleTypes.includes(article.type)) return;

    // get all the keys that we are currently filtering on from the search filters list
    const supportedFilters = [].concat.apply([], searchFiltersList[article.type].map(section => {
      return section.fieldNameKeys.map(key => key);
    }));

    return supportedFilters.includes(name);
  },

  getSearchLinkForTerm: (article, name, key) => {
    return `/?selectedCategory=${article.type}&${name}=${key}`;
  },

  getFirstImageForArticle: article => {
    if (article.photos && article.photos.length > 0) {
      // search pages return photos for articles in this format
      return article.photos[0].url;
    } else if (article.images && article.images.length > 0) {
      // user profile pages return photos for articles in this format
      return article.images[0];
    }
  },

  isEmptyArray: (article, name) => {
    const value = article[name];
    if (value && value.constructor === Array) {
      return value.length === 0;
    }
  },

  isArray: (article, name) => {
    const value = article[name];
    return value && value.constructor === Array;
  },

  getArticleSelectValue: (article, name, context) => {
    if (!article[name]) return null;

    // some article select fields have values like  { key: "value"},
    // and others like for impact_evidence and formal_evaluation have a
    // string like "value" which represents the key

    let key;
    if (article[name].key) {
      key = article[name].key;
    } else {
      key = article[name];
    }

    return i18n(`name:${name}-key:${key}`, context);
  },

  getArticleSelectKey: (article, name) => {
    if (!article[name]) return;
    if (article[name].hasOwnProperty("key")) {
      return article[name].key;
    } else if (article[name].hasOwnProperty("id")) {
      return article[name].id;
    } else {
      return article[name];
    }
  },

  getLocalizedValuesForKeys: (article, name, context) => {
    const arrayOfItems = article[name];
    if (!arrayOfItems || arrayOfItems.length === 0) return;

    return arrayOfItems.map(item => {
      if (typeof item === "string") {
        return {
          key: item,
          localizedValue: i18n(`name:${name}-key:${item}`, context)
        }
      } else {
        return {
          key: item.key,
          localizedValue: i18n(`name:${name}-key:${item.key}`, context)
        }
      }
    });
  },

  editAutocompleteGetSelectedItems: (article, name) => {
    const selectedItems = article[name];
    if (!selectedItems) return;

    if (Array.isArray(selectedItems) && selectedItems.length === 0) {
      return null;
    } else if (Array.isArray(selectedItems) && selectedItems.length > 0) {
      return selectedItems;
    } else {
      return [selectedItems];
    }
  },

  editAutocompleteGetSelectedLabel: (article, name) => {
    if (!article) return;
    const selected = article[name];
    if (!selected) return;
    return selected.title;
  },

  editAutocompleteGetSelectedId: (article, name) => {
    if (!article) return;
    const selected = article[name];
    if (!selected) return;
    return selected.id;
  },

  shouldShowBooleanValue: (article, name) => {
    if (article[name] === false || article[name] === true) {
      return true;
    } else {
      return false;
    }
  },

  getBooleanStringValue: (article, name, context) => {
    if (article[name] === false) {
      return i18n("no", context);
    } else if (article[name] === true) {
      return i18n("yes", context);
    }
  },

  getSelectedBooleanKey: (article, name) => {
    if (article[name] === false) {
      return "no";
    } else if (article[name] === true) {
      return "yes";
    } else {
      return null;
    }
  },

  getvalue: (article, name) => {
    const item = article[name];
    if (!item) return;

    if (item.hasOwnProperty("value")) {
      // if the item is an object with a value key, return that
      return item.value;
    } else if (!item.hasOwnProperty("value") && item.hasOwnProperty("key")) {
      // if the item doesn't not have a value and has a key, return the key
      return item.key;
    } else {
      // otherwise just return the item
      return item;
    }
  },

  hasValue: (article, name) => {
    if (!article) {
      return "undefined " + name;
    }
    const item = article[name];

    // potential falsey values
    // null
    // ""
    // []
    // { "value": "" }

    return (
      item !== null &&
      item !== "" &&
      !(item.hasOwnProperty("length") && item.length === 0) &&
      !(item.hasOwnProperty("value") && item.value === "")
    );
  },

  getKey: (article, name) => {
    if (article[name]) {
      return article[name].key;
    }
  },

  getArticleListKey: (article, name, key) => {
    return article[name] && article[name][key];
  },

  isSelectedInArray: (article, name, option) => {
    const options = article[name];
    if (options && options.length > 0) {
      return options.find(item => {
        if (!item) return;
        if (typeof item === "string") {
          return item === option;
        } else {
          return item.key === option.key;
        }
      });
    }
  },

  isSelected: (article, name, optionKey) => {
    const options = article[name];
    if (options) {
      return options.key === optionKey;
    }
  },

  getOptions: (article, name) => {
    return article[name];
  },

  getLinkSetValue(article, name, index, attr) {
    if (!article[name]) return;
    if (!article[name][index]) return;
    return article[name][index][attr];
  },

  linkSetFieldName(name, index, attr) {
    return `${name}[${index}][${attr}]`;
  },

  moment(date, format) {
    return moment(date).format(format);
  },

  formatDate(date, format, context) {
    setMomentLocale(context);
    return moment(date).format(format);
  },

  formatArticleDate(article, name, format, context) {
    setMomentLocale(context);
    if (article[name] && article[name] !== "") {
      return moment(article[name]).format(format);
    }
  },

  formatCurrentDate(format, context) {
    setMomentLocale(context);
    return moment(Date.now()).format(format);
  },

  getCaseEditSubmitType(req) {
    if (req.query.full === "1") {
      return "full";
    } else {
      return "quick";
    }
  },

  shareLink(type, article, req) {
    const url = currentUrl(req);
    const title = article.title;
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=Participedia: ${title} - ${url}`,
      linkedIn: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`
    };
    return shareUrls[type];
  },

  hasPhoto(article) {
    return article.photos && article.photos.length > 0;
  },

  hasCaptionText(photo) {
    return photo.title || photo.source_url || photo.attribution;
  },

  getFirstPhotoUrl(article) {
    return getFirstPhotoUrl(article);
  },

  isReaderPage(params) {
    return params && params.view && params.view === "view";
  },

  getPageTitle(req, article, context) {
    return getPageTitle(req, article, context);
  },

  socialTagsTemplate(article, req, context) {
    const defaultPhotoUrl = `https://${req.headers.host}/images/participedia-social-img.jpg`;
    const url = currentUrl(req);
    const title = getPageTitle(req, article, context);
    const description = (article && article.description) || i18n("main_tagline", context);
    const imageUrl = (article && getFirstPhotoUrl(article)) || defaultPhotoUrl;
    return socialTagsTemplate(title, description, url, imageUrl);
  },

  articleDataTitle(article) {
    return toTitleCase(article.type + " Data");
  },

  sortedEditHistory(editHistory) {
    return editHistory.sort((a,b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  },

  // search layout helpers
  cardLayoutType(req) {
    const defaultLayoutType = "grid";
    const type = req.query && req.query.layout;
    return type ? type : defaultLayoutType;
  },

  // pagination helpers
  paginationNumResults(cards, req) {
    const pageNum = parseInt(req.query.page);
    if (pageNum > 1) {
      return `${cards.length * (pageNum - 1) + 1} - ${cards.length * pageNum}`;
    } else {
      return "1 - " + cards.length;
    }
  },

  getCurrentPage(req) {
    if (req.query && req.query.page) {
      return req.query.page;
    } else {
      return 1;
    }
  },

  getPrevPageNum(req) {
    const currentPageNum = req.query && req.query.page;
    if (currentPageNum) {
      return parseInt(currentPageNum) - 1;
    } else {
      return 1;
    }
  },

  getNextPageNum(req, totalPages) {
    const currentPageNum = (req.query && parseInt(req.query.page)) || 1;
    if (currentPageNum !== parseInt(totalPages)) {
      return currentPageNum + 1;
    } else {
      return totalPages;
    }
  },

  // tab helpers
  isTabActive(req, tabName) {
    const tabParam = req.query && req.query.selectedCategory;
    // this is kind of hacky -- this will break in the case that when
    // have a default tab with the same name as a non-default tab on another page.
    // tab-contributions is default tab on /user/{id} (user-view)
    // tab-all is default tab on / (home-search)
    const defaultTabs = ["contributions", "all"];
    // if there is no param, make default tab active
    if (
      (!tabParam && defaultTabs.indexOf(tabName) > -1) ||
      tabParam === tabName
    ) {
      return "checked";
    }
  },

  getHomeTabs(context) {
    return [
      { title: i18n("All", context), key: "all" },
      { title: i18n("Cases", context), key: "case" },
      { title: i18n("Methods", context), key: "method" },
      { title: i18n("Organizations", context), key: "organizations" }
    ];
  },

  getUserTabs(context) {
    // if it's the profile owner making the request, return contributions and bookmarks.
    // otherwise return contributions only
    const profile = context.data.root.profile;
    const user = context.data.root.req.user;

    if ((user && user.id) === (profile && profile.id)) {
      return [
        { title: i18n("Contributions", context), key: "contributions" },
        { title: i18n("Bookmarks", context), key: "bookmarks" }
      ];
    } else {
      return [
        { title: i18n("Contributions", context), key: "contributions" }
      ];
    }

  },

  isSelectedUserTab(req, category) {
    const defaultTab = "contributions";
    if (req.query.selectedCategory) {
      return req.query.selectedCategory === category;
    } else if (category === defaultTab) {
      return true;
    }
  },

  isSelectedHomeTab(req, category) {
    const defaultTab = "all";
    if (req.query.selectedCategory) {
      return req.query.selectedCategory === category;
    } else if (category === defaultTab) {
      return true;
    }
  },

  // location helpers
  hasLocationData(article) {
    let hasLocationData = false;
    LOCATION_FIELD_NAMES.forEach(fieldName => {
      if (article[fieldName]) {
        hasLocationData = true;
      }
    });
    return hasLocationData;
  },

  getLocationValue(article) {
    const locationValues = LOCATION_FIELD_NAMES.map(field => {
      if (field !== "latitude" && field !== "longitude") {
        return article[field];
      }
    }).filter(field => field);

    return locationValues.join(", ");
  },

  locationFieldNames() {
    return LOCATION_FIELD_NAMES;
  },

  // user profile
  getInitials(username) {
    if (!username) return;

    let initials = "";
    const splitUsername = username.split(" ");

    if (splitUsername.length > 1) {
      // if there are 2 names in the string, extract each first letter
      initials = splitUsername[0].charAt(0) + splitUsername[1].charAt(0);
    } else {
      // otherwise just use the first letter of the string
      initials = username.charAt(0);
    }

    return initials.toUpperCase();
  },

  isProfileOwner(user, profile) {
    if (!user || !profile) return false;

    return user.id === profile.id;
  },

  getGravatarUrl(email) {
    if (!email) return;

    const emailHash = md5(email);
    return `https://www.gravatar.com/avatar/${emailHash}`;
  },

  getContributionsForProfile(profile) {
    const contributionTypes = ["cases", "methods", "organizations"];
    // merge all article types into 1 array
    let allContributions = [];
    contributionTypes.forEach(type => {
      allContributions = allContributions.concat(profile[type]);
    });
    return allContributions;
  },

  isNotLoggedIn(req) {
    const user = req.user;
    if (!user) {
      return true;
    } else {
      return false;
    }
  },

  // utilities
  currentUrl(req) {
    return currentUrl(req);
  },

  isNewView(req) {
    const baseUrls = ["/case", "/method", "/organization"];
    return baseUrls.includes(req.baseUrl) && req.path.indexOf("new") === 1;
  },

  isEditView(req) {
    const baseUrls = ["/case", "/method", "/organization", "/user"];
    return baseUrls.includes(req.baseUrl) && req.path.indexOf("edit") >= 0;
  },

  isReaderView(req) {
    const baseUrls = ["/case", "/method", "/organization"];
    return (
      baseUrls.includes(req.baseUrl) &&
      req.path.indexOf("edit") === -1 &&
      req.path.indexOf("new") !== 1
    );
  },

  isHomeSearchView(req) {
    return req.path === "/";
  },

  isUserView(req) {
    return req.baseUrl === "/user" && req.path.indexOf("edit") === -1;
  },

  toUpperCase(text) {
    return text.toUpperCase();
  },

  getRandomKey() {
    return parseInt(Math.random() * Math.random() * 1000000, 10);
  },

  isEqual(arg1, arg2) {
    return arg1 === arg2;
  },

  isString(x) {
    return typeof x === "string";
  },

  sanitizeName(name) {
    if (!name) return;
    // if name contains @, assume it's an email address, and strip the domain
    // so we are not sharing email address' publicly
    const atSymbolIndex = name.indexOf("@");
    if (atSymbolIndex > 0) {
      return name.substr(0, atSymbolIndex);
    } else {
      return name;
    }
  },

  lastModifiedInMs(filepath) {
    // return last modified datetime in ms for filepath
    const stats = fs.statSync(`${process.env.PWD}/public${filepath}`);
    return stats.mtimeMs;
  },

  isDandTSection(sectionKey) {
    return sectionKey === "about.committees.design_tech.p1";
  },

  // data
  getPartnersData() {
    return aboutData.partners;
  },

  getCommitteesData() {
    return aboutData.committees;
  },

  getStaffMembers() {
    return aboutData.staff.members;
  },

  getYearFromDate(date, format) {
    return moment(date).year();
  },

  // search filters
  searchFiltersSections(type) {
    return searchFiltersList[type];
  },

  getOptionsForFilterKey(name, context) {
    if (name === "country") {
      return countries.map(item => {
        return {
          key: item.value,
          value: i18n(item.value, context),
        };
      });
    } else {
      return sharedFieldOptions[name].map(key => {
        return {
          key: key,
          value: i18n(`name:${name}-key:${key}`, context),
        };
      });
    }
  }
};
