const { searchFilterKeyLists, searchFilterKeys } = require("./things");

function i18n(key, context) {
  return context && context.data && context.data.root.__(key);
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

function singularLowerCase(name) {
  return (name.slice(-1) === "s" ? name.slice(0, -1) : name).toLowerCase();
}

function typeFromReq(req) {
  let cat = singularLowerCase(req.query.selectedCategory || "Alls");
  return cat === "all" ? "thing" : cat;
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

export default {
  hasNextPage: (req, pages) => {
      console.log("hasNextPage")
    },

    paginationNumResults(cards, totalResults, req) {
      const pageNum = parseInt(req.query.page);
  
      let start = (pageNum - 1) * 20 + 1;
      let end = totalResults;
  
      if (20 < totalResults) {
        end = 20 * pageNum;
        if (end > totalResults) {
          end = totalResults;
        }
      }
  
      if (pageNum > 1) {
        return `${start} - ${end}`;
      } else {
        return "1 - " + cards.length;
      }
    },
    paginationCollections(req, context) {
      const keyLists = searchFilterKeyLists(typeFromReq(req));
      const filterKeys = searchFilterKeys(typeFromReq(req));
      const filterArr = keyLists.concat(filterKeys);
  
      const searchFilterKeyListMapped = filterArr
        .map(key => filterCollections(req, key, context))
        .filter(el => el);
      const arr = concactArr(searchFilterKeyListMapped);
  
      if (arr.length !== 0) {
        return ` ${arr}`;
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
  
    getPaginationRange(total, req) {
      let length = 3;
      let current = 1;
  
      if (req.query && req.query.page) {
        current = req.query.page;
      }
  
      if (length > total) length = total;
  
      let start = current - Math.floor(length / 2);
      start = Math.max(start, 1);
      start = Math.min(start, 1 + total - length);
  
      let range = Array.from({ length: length }, (el, i) => {
        let page = start + i;
        return { page: page, isActive: page == current };
      });
  
      if (total > length) {
        let dots = { page: null, isActive: false };
        if (range[range.length - 1].page == total) {
          range.unshift({ page: 1, isActive: current == 1 }, dots);
        } else {
          range.push(dots, { page: total, isActive: total == current });
        }
      }
  
      return range;
    },
  
    getPaginationCategoryLabel(req, context) {
      const category = req.query.selectedCategory || undefined;
      let text;
  
      switch (category) {
        case "case": {
          text = "cases of";
          break;
        }
        case "organizations": {
          text = "organizations of";
          break;
        }
        case "method": {
          text = "methods of";
          break;
        }
        case "collections": {
          text = "collections of";
          break;
        }
        default: {
          text = "entries of";
          break;
        }
      }
  
      return i18n(text, context);
    },
}