const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
let unless = require("express-unless");

// In a test environment, the secret has been stored in the environment var
let secret = process.env.TOKEN_SECRET;
// In production, we juse jwks-rsa to get a token from the auth0 server
if (!secret) {
  secret = jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://participedia.auth0.com/.well-known/jwks.json`
  });
}

let requiredOptions = {
  secret: secret,
  // audience: "https://api.participedia.xyz",
  issuer: "https://participedia.auth0.com/",
  algorithms: ["RS256"],
  credentialsRequired: true,
  getToken: req => {
    console.log('Cookie token: %s', req.cookies.token);
    req.cookies.token || null
  }
};
const checkJwtRequired = jwt(requiredOptions);

// clone a new (shallow) copy so we don't accidentally over-ride options for checkJwtRequire
let optionalOptions = Object.assign({}, requiredOptions, {
  credentialsRequired: false
});
const checkJwtOptional = jwt(optionalOptions);

checkJwtOptional.unless = unless;
checkJwtRequired.unless = unless;

module.exports = { checkJwtRequired, checkJwtOptional };
