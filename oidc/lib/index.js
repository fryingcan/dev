const express = require('express');
const Provider = require('oidc-provider');

const app = express();

console.log("Starting provider.");

const oidc = new Provider('https://openid.momoperes.ca');

// behind HTTPS proxy
app.enable('trust proxy');
oidc.proxy = true;

oidc.initialize().then(function () {
    app.use('/', oidc.callback);
    app.listen(3000, "0.0.0.0");
});