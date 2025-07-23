const { OAuthStrategy } = require("./baseStrategy");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

class GoogleOAuthStrategy extends OAuthStrategy {
    constructor(config) {
        super({
            provider: "google",
            ClassStrategy: GoogleStrategy,
            config: {
                clientID: config.clientID,
                clientSecret: config.clientSecret,
                callbackURL: config.callbackURL
            }
        });
    }
}

module.exports = GoogleOAuthStrategy;
