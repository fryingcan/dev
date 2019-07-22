// "Interactions" are essentially the routes used for authentication and consent.
// When the user accesses the auth endpoint (/auth), they are redirected to a unique URL
// that contains an ID (/interaction/:id). This route renders the authentication prompt (e.g.)
// login credentials. The ID is stored in the OIDC's database and maps to client_id, etc.
// The user POSTs their authentication to a sub-route (/interaction/:id/login), which then finishes
// the interaction and creates a session that can issue an ID token.
// What happens next depends on the flow used (e.g. authg code, implicit, etc.).

const querystring = require('querystring');
const { urlencoded } = require('express');
const body = urlencoded({ extended: false });

module.exports = (app, provider) => {
    // app: the Express server app
    // provider: node-oidc-provider "Provider" instance

    const { constructor: { errors: { SessionNotFound } } } = provider; // Import the SessionNotFound error

    // Use the _layout.ejs tempalte as base for the other templates
    app.use((req, res, next) => {
        const orig = res.render;
        res.render = (view, locals) => {
            app.render(view, locals, (err, html) => {
                if (err) throw err;
                orig.call(res, '_layout', {
                    ...locals,
                    body: html,
                });
            });
        };
        next();
    });

    // Disables caching when called
    function setNoCache(req, res, next) {
        res.set('Pragma', 'no-cache');
        res.set('Cache-Control', 'no-cache, no-store');
        next();
    }

    // This is the route with a unique interaction ID, that should show the auth methods
    app.get("/interaction/:grant", setNoCache, async (req, res, next) => {
        try {
            // details: the OAuth parameters given by the client
            const details = await provider.interactionDetails(req);
            // client: the info about the client, retrieved from persistence
            const client = await provider.Client.find(details.params.client_id);

            if (details.interaction.error === "login_required") {
                // The user is not already logged-in
                return res.render("login", {
                    client, details,
                    title: "Sign-in"
                });
            }
            // Redirect to consent page
            res.statusCode = 302; // eslint-disable-line no-param-reassign
            res.setHeader('Location', "/interaction/" + req.params.grant + "/confirm");
            res.setHeader('Content-Length', '0');
            res.end();
            // User is authenticated, show consent form
            // return res.render("authorize", {
            //    client, details,
            //    title: "Authorize"
            // });
        } catch (err) {
            next(err);
        }
    });

    // When the user logs in using either a client certificate or username/password
    app.post("/interaction/:grant/login", setNoCache, body, async (req, res, next) => {
        try {
            // TODO: authentication from body parameters

            const result = {
                // "Prompts" work by the keys being provided in this "result" object. "consent" and "login" prompts must both be provided for the interaction to complete.
                login: {
                    account: require('uuid').v4(), // TODO
                    acr: 'urn:mace:incommon:iap:bronze', // TODO: ???
                    amr: ['pwd'], // TODO: ???
                    remember: false,
                    ts: Math.floor(Date.now() / 1000)
                }
            };

            await provider.interactionResult(req, res, result);

            // Redirect to consent page
            res.statusCode = 302;
            res.setHeader('Location', "/interaction/" + req.params.grant + "/confirm");
            res.setHeader('Content-Length', '0');
            res.end();
        } catch (err) {
            next(err);
        }
    });

    // Show the consent page if already logged-in
    app.get("/interaction/:grant/confirm", setNoCache, async (req, res, next) => {
        try {
            // details: the OAuth parameters given by the client
            const details = await provider.interactionDetails(req);
            // client: the info about the client, retrieved from persistence
            const client = await provider.Client.find(details.params.client_id);
            console.log(details.interaction);

            if (details.interaction.error === "login_required") {
                // Redirect to login page -- not authenticated
                res.statusCode = 302;
                res.setHeader('Location', "/interaction/" + req.params.grant);
                res.setHeader('Content-Length', '0');
                res.end();
                return;
            }

            return res.render("authorize", {
                client, details,
                title: "Authorize"
             });
        } catch(err) {
            next(err);
        }
    });

    // Complete consent for this interaction
    app.post("/interaction/:grant/confirm", setNoCache, body, async (req, res, next) => {
        try {
            const result = { consent: {} };
            await provider.interactionFinished(req, res, result);
        } catch (err) {
            next(err);
        }
    });

    app.use((err, req, res, next) => {
        if (err instanceof SessionNotFound) {
            // TODO: handle interaction expired / session not found error
        }
        next(err);
    });
}
