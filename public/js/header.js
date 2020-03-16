import Auth0Lock from "auth0-lock";

import tracking from "./utils/tracking.js";
import modal from "./modal.js";

var Auth = (function() {

  var wm = new WeakMap();
  var privateStore = {};
  var lock;

  function Auth() {
    this.lock = new Auth0Lock(
     "fquxAp5f3hsdbXI6EcuBotKiR3OyDvtj",
      "participedia.auth0.com"
    );
    wm.set(privateStore, {
      appName: "test-custom-login-page"
    });
  }

  Auth.prototype.getProfile = function() {
    return wm.get(privateStore).profile;
  };

  Auth.prototype.authn = function() {
    // Listening for the authenticated event
    this.lock.on("authenticated", function(authResult) {
      // Use the token in authResult to getUserInfo() and save it if necessary
      this.getUserInfo(authResult.accessToken, function(error, profile) {
        if (error) {
          // Handle error
          return;
        }


        //we recommend not storing Access Tokens unless absolutely necessary
        wm.set(privateStore, {
          accessToken: authResult.accessToken
        });

        wm.set(privateStore, {
          profile: profile
        });

        console.log("profile", profile)

      });
    });
  };
  return Auth;
}());

const header = {
  init() {
    this.initLogInButton();
    this.initSignUpButton();
    this.initProfileDropdownMenu();
  },

  openSignupLoginModal({ initialScreen }) {
    var lock = new Auth0Lock(
      "fquxAp5f3hsdbXI6EcuBotKiR3OyDvtj",
      "participedia.auth0.com",
      {
        initialScreen: initialScreen || "signUp",
        languageDictionary: {
          title: "Welcome Back! Remember, as a wiki contributor, you can publish your own, new entries as well as edit existing content, and everything on Participedia is part of the Creative Commons. Don't forget to update your profile page (that's where you'll find your contributions and bookmarks too).",
          signUpTitle: "Join Now! It only takes 30 seconds to become a Participedia wiki contributor, and you can update your profile page later (that's where you'll find your contributions and bookmarks too). Remember, as a wiki contributor, you can publish your own, new entries as well as edit existing content, and everything on Participedia is part of the Creative Commons."
        },
        language: document.querySelector("html").getAttribute("lang"),
        theme: {
          logo:
            "https://s3.amazonaws.com/participedia.prod/participedia-logo.svg",
          primaryColor: "#EC2024",
        },
        auth: {
          redirect_uri: "http://localhost:3001/callback",
          responseType: "code",
          params: {
            scope: "email",
          },
        },
      }
    );
    lock.on("authenticated", function(authResult) {
      console.log("authResult", authResult)
      this.getUserInfo(authResult.accessToken, function(error, profile) {
        if (error) {
          // Handle error
          return;
        }
        console.log("profile", profile)
      });
    });
    lock.show();
  },

  initSignUpButton() {
    const signupButtonEl = document.querySelector(".js-header-signup-button");

    if (!signupButtonEl) return;

    signupButtonEl.addEventListener("click", event => {
      event.preventDefault();
      tracking.sendWithCallback("header", "signup_button_click", "", () => {
         this.openSignupLoginModal({initialScreen: "signUp"});
      });
    });
  },

  initLogInButton() {
    const loginButtonEl = document.querySelector(".js-header-login-button");

    if (!loginButtonEl) return;

    loginButtonEl.addEventListener("click", event => {
      event.preventDefault();
      tracking.sendWithCallback("header", "login_button_click", "", () => {
         this.openSignupLoginModal({initialScreen: "login"});
      });
    });
  },

  initProfileDropdownMenu() {
    const containerEl = document.querySelector(
      ".js-profile-dropdown-button-container"
    );

    if (!containerEl) return;

    containerEl.addEventListener("click", e => {
      const button = e.target.closest(".js-profile-dropdown-button-trigger");
      if (button) {
        const isOpen = containerEl.getAttribute("state") === "open";
        const itemsContainerEl = containerEl.querySelector(
          ".js-profile-dropdown-button-items"
        );
        if (isOpen) {
          // close items
          itemsContainerEl.style.display = "none";
          containerEl.setAttribute("state", "closed");
        } else {
          // open items
          itemsContainerEl.style.display = "flex";
          containerEl.setAttribute("state", "open");
        }
      }
    });
  },
};

export default header;
