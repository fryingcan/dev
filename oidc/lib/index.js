const express = require('express');
const Provider = require('oidc-provider');

const app = express();

console.log("Starting provider.");

const oidc = new Provider('https://openid.momoperes.ca', {  // TODO: Env variable
    claims: {
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

oidc.initialize({clients}).then(function () {
    // behind HTTPS proxy
    app.enable('trust proxy');
    oidc.proxy = true;

    app.use(oidc.callback);
    app.listen(3000, "0.0.0.0");
});