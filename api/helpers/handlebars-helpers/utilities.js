export default {
  LOCATION_FIELD_NAMES,
  setMomentLocale,
  toTitleCase,
  mapIdTitleToKeyValue,
  currentUrl,
  getFirstLargeImageForArticle,
  getFirstThumbnailImageForArticle,
  filterCollections,
  typeFromReq
}
const LOCATION_FIELD_NAMES = [
  "address1",
  "address2",
  "city",
  "province",
  "postal_code",
  "country",
  "latitude",
  "longitude",
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
      value: item.title,
    };
  });
}

function currentUrl(req) {
  const path = req.originalUrl;
  const host = req.headers.host;
  return `https://${host}${path}`;
}

function getFirstLargeImageForArticle(article) {
  if (article.photos && article.photos.length > 0) {
    return encodeURI(article.photos[0].url);
  }
}

function getFirstThumbnailImageForArticle(article) {
  let url = getFirstLargeImageForArticle(article);

  if (url) {
    let imagePath = "thumbnail";

    // Handle existing GIF by opening it from the raw folder
    if (url.indexOf(".gif") >= 0) {
      imagePath = "raw";
    }

    return url.replace(
      process.env.AWS_UPLOADS_URL,
      `${process.env.AWS_UPLOADS_URL}${imagePath}/`
    );
  }
}

function filterCollections(req, name, context) {
  let query = req.query[name];
  if (query) {
    let keyList = Object.keys(req.query);
    let keys = keyList.filter(item => item !== "selectedCategory");
    let arr = query.split(",");
    let value = [];
    for (let i in keys) {
      for (let x in arr) {
        if (keys[i] === "country") {
          let category = i18n(`country_label`, context);
          value.push(`${category} includes`);
          value.push(req.query.country.replace(/,/g, ", "));
        } else {
          if (keys[i] !== "query") {
            if (sharedFieldOptions[keys[i]].includes(arr[x])) {
              let str = `name:${keys[i]}-key:${arr[x]}`;
              let category = i18n(
                `${req.query.selectedCategory}_view_${keys[i]}_label`,
                context
              );
              value.push(`${category} includes`);
              value.push(i18n(str, context));
            }
          }
        }
      }
    }
    return [...new Set(value)];
  }
}

function typeFromReq(req) {
  let cat = singularLowerCase(req.query.selectedCategory || "Alls");
  return cat === "all" ? "thing" : cat;
}

const singularLowerCase = name =>
  (name.slice(-1) === "s" ? name.slice(0, -1) : name).toLowerCase();

function getPageTitle(req, article, context) {
  const path = req.route && req.route.path;
  const is404 = context.data.exphbs.view === "404";

  const titleByPath = {
    "/": "Participedia",
    "/about": i18n("About", context) + " – Participedia",
    "/teaching": i18n("Teaching", context) + " – Participedia",
    "/research": i18n("Research", context) + " – Participedia",
    "/404":
      i18n("Sorry, this page cannot be found", context) + " – Participedia",
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
}

function concactArr(arr) {
  let str = "where";
  for (let i = 0; i < arr.length; i++) {
    if (i === arr[i].length - 1) {
      str += " and";
    }
    for (let j = 0; j < arr[i].length; j++) {
      str += ` ${arr[i][j]}`;
    }
  }
  return str;
}

const i18n = (key, context) =>
  context && context.data && context.data.root.__(key);