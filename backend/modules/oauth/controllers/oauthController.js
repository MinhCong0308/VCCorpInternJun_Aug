const responseUtils = require("utils/responseUtils");
const oauthService = require("modules/oauth/services/oauthService");
const passport = require("modules/oauth/passport");
const oauthController = {
    loginWithGoogle: (req, res, next) => {
        passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    },
    googleCallback: async (req, res) => {
        try {
            const oauthResult = req.user; // User data from passport
            res.cookie("accessToken", oauthResult.accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 3600000, // 1 hour
            });
            res.cookie("refreshToken", oauthResult.refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 31536000000, // 1 year 
            });
            res.redirect("http://localhost:4200/login?oauth=success");
        } catch (error) {
            console.error("Google OAuth callback error:", error);
            return responseUtils.error(res, error.message);
        }
    }

};
module.exports = oauthController;