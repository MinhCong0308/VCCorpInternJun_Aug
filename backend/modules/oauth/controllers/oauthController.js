const responseUtils = require("utils/responseUtils");
const oauthService = require("modules/oauth/services/oauthService");
const passport = require("modules/oauth/passport");
const oauthController = {
    loginWithGoogle: (req, res, next) => {
        passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    },
    googleCallback: async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                return responseUtils.unauthorized(res, "Authentication failed");
            }
            return responseUtils.ok(res, user);
        } catch (error) {
            console.error("Google OAuth callback error:", error);
            return responseUtils.error(res, error.message);
        }
    }

};
module.exports = oauthController;