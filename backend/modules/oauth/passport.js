const passport = require("passport");
const config = require("configs/index");
const GoogleOAuthStrategy = require("./strategies/googleStrategy");

if (config.config.oauth?.google?.clientID) {
    const googleStrategy = new GoogleOAuthStrategy({
        clientID: config.config.oauth.google.clientID,
        clientSecret: config.config.oauth.google.clientSecret,
        callbackURL: config.config.oauth.google.callbackURL
    });

    passport.use("google", googleStrategy.createStrategy());
}

module.exports = passport;
