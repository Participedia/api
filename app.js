"use strict";

// deploy on heroku-18 stack
const path = require("path");
const process = require("process");
require("dotenv").config({ silent: process.env.NODE_ENV === "production" });
const express = require("express");
const app = express();
const exphbs = require("express-handlebars");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const session = require("express-session");
//const passport = require("passport");
//const Auth0Strategy = require("passport-auth0");
const i18n = require("i18n");
const apicache = require("apicache");
const compression = require("compression");
const errorhandler = require("errorhandler");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const Sentry = require("@sentry/node");

// only instantiate sentry logging if we are on staging or prod
if (
  process.env.NODE_ENV === "production" ||
  process.env.NODE_ENV === "staging"
) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
}

// other logging middlewear
app.use(morgan("dev")); // request logging

// Actual Participedia APIS vs. Nodejs gunk
const handlebarsHelpers = require("./api/helpers/handlebars-helpers.js");
const { case_ } = require("./api/controllers/case");
const { method } = require("./api/controllers/method");
const { organization } = require("./api/controllers/organization");
const bookmark = require("./api/controllers/bookmark");
const search = require("./api/controllers/search");
const list = require("./api/controllers/list");
const user = require("./api/controllers/user");
const { getUserOrCreateUser } = require("./api/helpers/user.js");
const oldDotNetUrlHandler = require("./api/helpers/old-dot-net-url-handler.js");
const { SUPPORTED_LANGUAGES } = require("./constants.js");
const logError = require("./api/helpers/log-error.js");

const port = process.env.PORT || 3001;

app.use(errorhandler());
// canonicalize url
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === "production" &&
    req.hostname !== "participedia.net" &&
    !res.headersSent
  ) {
    res.redirect("https://participedia.net" + req.originalUrl);
  } else {
    next();
  }
});
// CONFIGS
app.use(compression());
app.set("port", port);
app.use(express.static("public", { index: false }));
app.use(methodOverride()); // Do we actually use/need this?
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

i18n.configure({
  locales: SUPPORTED_LANGUAGES.map(locale => locale.twoLetterCode),
  cookie: "locale",
  extension: ".js",
  directory: "./locales",
  updateFiles: false,
});

app.use((req, res, next) => {
  // set english as the default locale, if it's not already set
  if (!req.cookies.locale) {
    res.cookie("locale", "en", { path: "/" });
  }
  next();
});

app.use(i18n.init);

// config express-session
const sess = {
  store: new (require("connect-pg-simple")(session))(),
  secret: process.env.COOKIE_SECRET,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
  resave: false,
  saveUninitialized: true,
};

if (app.get("env") === "production") {
  sess.cookie.secure = true; // serve secure cookies, requires https
}

app.use(session(sess));
app.set("trust proxy", 1);

// // Configure Passport to use Auth0
// const strategy = new Auth0Strategy(
//   {
//     domain: process.env.AUTH0_DOMAIN,
//     clientID: process.env.AUTH0_CLIENT_ID,
//     clientSecret: process.env.AUTH0_CLIENT_SECRET,
//     callbackURL: process.env.CALLBACK_URL || "/redirect",
//   },
//   function(accessToken, refreshToken, extraParams, profile, done) {
//     // accessToken is the token to call Auth0 API (not needed in the most cases)
//     // extraParams.id_token has the JSON Web Token
//     // profile has all the information from the user
//     return done(null, profile);
//   }
// );

// passport.use(strategy);

// app.use(passport.initialize());
// app.use(passport.session());

// // You can use this section to keep a smaller payload
// passport.serializeUser(function(user, done) {
//   done(null, user);
// });

// passport.deserializeUser(async function(user, done) {
//   // get db user from auth0 user data
//   const dbUser = await getUserOrCreateUser(user._json);
//   done(null, dbUser);
// });

// // Perform the login, after login Auth0 will redirect to callback
// app.get("/login", function(req, res, next) {
//   // set returnTo session var to referer so user is redirected to current page after login
//   req.session.returnTo = req.headers.referer;
//   req.session.refreshAndClose = req.query.refreshAndClose;
//   passport.authenticate(
//     "auth0",
//     {
//       scope: "offline openid email profile",
//     },
//     () => {}
//   )(req, res, next);
// });

// // Perform the final stage of authentication and redirect to previously requested URL or '/user'
// app.get("/redirect", function(req, res, next) {
//   passport.authenticate("auth0", function(err, user, info) {
//     if (err) {
//       return next(err);
//     }
//     if (!user) {
//       // return res.redirect("/login");
//       return res.redirect("/");
//     }
//     req.logIn(user, function(err) {
//       if (err) {
//         return next(err);
//       }
//       let returnToUrl = req.session.returnTo;
//       const refreshAndClose = req.session.refreshAndClose;
//       delete req.session.returnTo;
//       delete req.session.refreshAndClose;
//       if (refreshAndClose === "true") {
//         returnToUrl = returnToUrl + "?refreshAndClose=true";
//       }
//       res.redirect(returnToUrl || "/");
//     });
//   })(req, res, next);
// });

// // Perform session logout and redirect to homepage
// app.get("/logout", (req, res) => {
//   const currentUrl = `${req.protocol}://${req.headers.host}`;
//   req.logout();
//   res.redirect(
//     `https://${process.env.AUTH0_DOMAIN}/v2/logout?returnTo=${currentUrl}`
//   );
// });

const cache = apicache.middleware;
apicache.options({
  debug: true,
  enabled: false,
  successCodes: [200, 201],
});
// TODO Invalidate apicache on PUT/POST/DELETE using apicache.clear(req.params.collection);

const hbs = exphbs.create({
  // Specify helpers which are only registered on this instance.
  defaultLayout: "main",
  extname: ".html",
  helpers: handlebarsHelpers,
});

app.engine(".html", hbs.engine);
app.set("view engine", ".html");

// make data available as local vars in templates
app.use((req, res, next) => {
  const gaTrackingIdByEnv = {
    production: process.env.GOOGLE_TRACKING_ID_PROD,
    staging: process.env.GOOGLE_TRACKING_ID_STAGE,
    development: process.env.GOOGLE_TRACKING_ID_DEV,
  };

  res.locals.req = req;
  res.locals.GA_TRACKING_ID = gaTrackingIdByEnv[process.env.NODE_ENV];
  next();
});

// ROUTES
app.use("/", cache("5 minutes"), search);

app.use("/case", case_);
app.use("/organization", organization);
app.use("/method", method);
app.use("/list", list);
app.use("/user", user);
app.use("/bookmark", bookmark);

// endpoint to set new locale
app.get("/set-locale", function(req, res) {
  const locale = req.query && req.query.locale;
  const redirectTo = req.query && req.query.redirectTo;
  if (locale) {
    res.cookie("locale", locale, { path: "/" });
  }
  return res.redirect(redirectTo || "/");
});

app.get("/about", function(req, res) {
  res.status(200).render("about-view");
});

app.get("/login", function(req, res) {
  res.status(200).render("login-view");
});

app.get("/callback", function(req, res) {
  res.status(200).render("callback-view");
});

app.get("/legal", function(req, res) {
  res.status(200).render("legal-view");
});
app.get("/research", function(req, res) {
  res.status(200).render("research-view");
});
app.get("/teaching", function(req, res) {
  res.status(200).render("teaching-view");
});
app.get("/content-chooser", function(req, res) {
  res.status(200).render("content-chooser");
});

// redirect old user profile for tanyapuravankara to new url
// we are only doing it for this user account, since it gets hits on google
app.get("/en/people/tanyapuravankara", function(req, res) {
  return res.redirect("/user/8198");
});

// redirect old .net urls to their new urls
app.use((req, res, next) => {
  const path = req.originalUrl;
  if (oldDotNetUrlHandler.hasMatch(path)) {
    // redirect old .net urls to new urls
    return res.redirect(oldDotNetUrlHandler.getNewUrl(path));
  }
  next();
});

app.get("/robots.txt", function(req, res, next) {
  // send different robots.txt files for different environments
  if (
    process.env.NODE_ENV === "staging" ||
    process.env.NODE_ENV === "production"
  ) {
    return res
      .status(200)
      .sendFile(`${process.env.PWD}/public/robots-${process.env.NODE_ENV}.txt`);
  }
  next();
});

// 404 error handling
// this should always be after all routes to catch all invalid urls
app.use((req, res, next) => {
  res.status(404).render("404");
});

// The error handler must be before any other logging middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

if (process.env.NODE_ENV === "development") {
  // only use in development
  app.use(errorhandler());
}

// Better logging of "unhandled" promise exceptions
process.on("unhandledRejection", function(reason, p) {
  logError(`Possibly Unhandled Rejection at: Promise for reason ${reason}`);
});

module.exports = app;
