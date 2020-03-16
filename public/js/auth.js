document.addEventListener("DOMContentLoaded", () => {
  var webAuth = new auth0.WebAuth({
    domain: "participedia.auth0.com",
    clientID: "fquxAp5f3hsdbXI6EcuBotKiR3OyDvtj",
  });

  document.querySelector(".js-login-view__login-button").addEventListener("click", (e) => {
    e.preventDefault();

    // webAuth.login({
    //   realm: 'test',
    //   email: 'alanna.scott@gmail.com',
    //   password: 'one24one',
    //   redirectUri: "http://localhost:3001/callback",
    //   responseType: "code"
    // });
  })
});
