const passport = require("passport");
const GoogleOAuthStrategy = require("./strategies/googleStrategy");
const config = require("configs/index");

if (config.config.oauth?.google?.clientID) {
    const googleStrategy = new GoogleOAuthStrategy({
        clientID: config.config.oauth.google.clientID,
        clientSecret: config.config.oauth.google.clientSecret,
        callbackURL: config.config.oauth.google.callbackURL
    });
    passport.use("google", googleStrategy.createStrategy());
}
