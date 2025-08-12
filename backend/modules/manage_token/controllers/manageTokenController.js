const manageTokenServices = require('modules/manage_token/services/manageTokenService');
const responseUtils = require("utils/responseUtils");
const jwt = require('jsonwebtoken');
const config = require('configs/index');

const manageTokenController = {
    refreshToken: async(req, res) => {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if(!refreshToken) {
                return responseUtils.unauthorized(res, 'Unauthorized, Please log in');
            }
            const decoded = jwt.verify(refreshToken, config.config.jwt.secret);
            if(!decoded || ! decoded.userId) {
                return responseUtils.unauthorized(res, 'Token is not usable');
            }
            // check for blacklist existance token
            const isTokenRevoked = manageTokenServices.isTokenRevoked('refresh', refreshToken);
            if(isTokenRevoked) {
                return responseUtils.unauthorized(res, 'Token is revoked');
            }
            const newToken = await manageTokenServices.refreshToken(decoded.userId);
            res.cookie("accessToken", newToken.accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 3600000, // 1 hour
            });
            res.cookie("refreshToken", newToken.refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 604800000, // 1 week
            });
            await manageTokenServices.revokeToken('refresh', refreshToken);
            return responseUtils.ok(res, newToken);
        } catch(error) {
            return responseUtils.unauthorized(res, 'Unauthorized: ' + error.message);
        }
    },
    revokeToken: async(req, res) => { // request for admin for forcing to revoke customer's token
        try {
            const {accessToken, refreshToken} = req.body;
            if(!accessToken || !refreshToken) {
                return responseUtils.error(res, 'Access token and refresh token are required');
            }
            await manageTokenServices.revokeToken('access', accessToken);
            await manageTokenServices.revokeToken('refresh', refreshToken);
            return responseUtils.ok(res, 'Tokens revoked successfully');
        } catch(error) {
            return responseUtils.unauthorized(res, 'Unauthorized: ' + error.message);
        }
    }
};
module.exports = manageTokenController;