require("dotenv").config();

const oauthConfig = {
    oauth: {
        google: {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/oauth/google/callback"
        },
        facebook: {
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL || "http://localhost:3000/auth/oauth/facebook/callback"
        },
        github: {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/auth/oauth/github/callback"
        }
    }
};

module.exports = oauthConfig;
