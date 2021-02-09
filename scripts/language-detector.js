// Depencies
const { db, SEARCH } = require("../api/helpers/db");
const { parse } = require("json2csv");
const { ComprehendClient, BatchDetectDominantLanguageCommand } = require("@aws-sdk/client-comprehend");
const comprehendClient = new ComprehendClient({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

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

languageDetector.detectLangauge = async () => {
  const params = {
    TextList: ['Hello World']
  };
  try {
    const batchDetectDominantLanguageCommand = new BatchDetectDominantLanguageCommand(params);
    const data = await comprehendClient.send(batchDetectDominantLanguageCommand);
    // process data.
    console.log(data);
  } catch (error) {
    // error handling.
    console.log(error);
  } finally {
    // finally.
    console.log("finaly");
  }
}

languageDetector.detectLangauge();
// languageDetector.getLocalizationData();