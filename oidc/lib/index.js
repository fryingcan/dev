// This is the entrypoint of the application.
// The oidc-provider is servied using Express.

const express = require('express');
const Provider = require('oidc-provider');
const app = express();
const interactionRoutes = require("./interaction/routes");
const path = require('path');

// Set up rendering HTML templates using EJS
app.set('views', path.join(__dirname, 'interaction', 'views'));
app.set('view engine', 'ejs');

const oidc = new Provider('https://openid.momoperes.ca', {  // TODO: Env variable
    claims: {
        // Defines the mapping for scope -> allowed claims
        groups: ["groups"]
    }
});

// TODO: dynamic clients (source from Vault?)
const clients = [
    {
        client_id: 'test',
        client_secret: "test",
        grant_types: ["authorization_code"],
        redirect_uris: ["https://vault.momoperes.ca/ui/vault/auth/oidc/oidc/callback"]
    }
]

// TODO: Provide adapters in the .initialize() settings
oidc.initialize({clients}).then(function () {
    // behind HTTPS proxy
    app.enable('trust proxy');
    oidc.proxy = true;

    interactionRoutes(app, oidc);
    app.use(oidc.callback);
    app.listen(3000, "0.0.0.0"); // TODO: Env variable
});