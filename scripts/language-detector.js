// Depencies
const { db, SEARCH } = require("../api/helpers/db");
const { parse } = require("json2csv");

// Define container
const languageDetector = {};

// Method to query localization data
languageDetector.getLocalizationData = async () => {
  const results = await db.any(`
    SELECT lt.body, lt.thingid, lt.language, t.original_language, t.type
    FROM localized_texts lt
    LEFT JOIN things t
    ON t.id = lt.thingid
  `);
  for (let i = 0; i < results.length; i++) {
    const data = results[i];
    // Remove html tags and get first 300 characters
    const bodyStr = data.body.replace(/<[^>]*>?/gm, '').substring(0, 300);
    console.log(data);
    console.log('@@@@');

    // @TODO Call AWS comprehend to detect language
    const detectedLangauge = '';

    // @TODO generate CSV
  }
}

languageDetector.getLocalizationData();