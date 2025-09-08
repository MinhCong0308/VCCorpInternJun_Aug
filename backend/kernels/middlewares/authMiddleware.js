const jwt = require('jsonwebtoken');
const config = require('configs/index');
const responseUtils = require('utils/responseUtils');
const db = require('models/index');
const manageTokenServices = require('modules/manage_token/services/manageTokenService');
const authenticated = async (req, res, next) => {
    try {
        console.log("Check for cookie: ", req.cookies);
        const accessToken = req.cookies?.accessToken;
        if (!accessToken) {
            return responseUtils.unauthorized(res, 'No token provided');
        }
        const decoded = jwt.verify(accessToken, config.config.jwt.secret);
        console.log('Decoded: ', decoded);
        if (!decoded || !decoded.userId) {
            return responseUtils.unauthorized(res, 'Invalid token');
        }
        const isRevoked = await manageTokenServices.isTokenRevoked('access', accessToken);
        if(isRevoked) {
            return responseUtils.unauthorized(res, 'Token is revoked');
        }
        const userid = decoded.userId;
        const user = await db.User.findByPk(userid, {
            where: { status: config.config.statusenum.AUTHENTICATED },
            include : [{
                model: db.Role,
                attributes: ['rolename'],
                as: 'Role'
            }]
        });
        if (!user) {
            return responseUtils.unauthorized(res, 'User not found or not authenticated');
        }
        req.user = user;
        next();
    } catch (error) {
        return responseUtils.unauthorized(res, 'Unauthorized: ' + error.message);
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return responseUtils.unauthorized(res, 'Unauthorized');
        }
        if (!roles.includes(req.user.Role.rolename)) {
            return responseUtils.unauthorized(res, 'Forbidden: You do not have permission to access this resource');
        }
        next();
    };
};

module.exports = {
    authenticated,
    checkRole
};
