// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

const auth0 = require("auth0-js");

Cypress.Commands.add(
  "login",
  (
    overrides = {
      username: "alanna.scott+cypress_test@gmail.com",
      password: "cypress"
    }
  ) => {
    cy.wait(4000);
    // input username and password
    cy.get("input[name=username]").type(overrides.username);
    cy.get("input[name=password]").type(overrides.password);
    cy.get(".auth0-lock-submit").click();
    cu.url().should("include", "localhost")

    // wait for redirect
    cy.wait(4000);
  }
);

Cypress.Commands.add("loginAsAdmin", (overrides = {}) => {
  Cypress.log({
    name: "loginAsAdmin"
  });
  // todo: create test admin account
  // cy.login({
  //   email: "",
  //   password: "",
  // });
});

Cypress.Commands.add("logout", (overrides = {}) => {
  Cypress.log({
    name: "logout"
  });
  cy.visit("/logout");
});
