// "Interactions" are essentially the routes used for authentication and consent.
// When the user accesses the auth endpoint (/auth), they are redirected to a unique URL
// that contains an ID (/interaction/:id). This route renders the authentication prompt (e.g.)
// login credentials. The ID is stored in the OIDC's database and maps to client_id, etc.
// The user POSTs their authentication to a sub-route (/interaction/:id/login), which then finishes
// the interaction and creates a session that can issue an ID token.
// What happens next depends on the flow used (e.g. authg code, implicit, etc.).

module.exports = (app, provider) => {
    // app: the Express server app
    // provider: node-oidc-provider "Provider" instance

    const { constructor: { errors: { SessionNotFound } } } = provider; // Import the SessionNotFound error

    // Use the _layout.ejs tempalte as base for the other templates
    app.use((req, res, next) => {
        const orig;
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
}
