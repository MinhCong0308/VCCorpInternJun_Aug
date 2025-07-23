const jwt = require('jsonwebtoken');
const config = require('configs/index');
const responseUtils = require('utils/responseUtils');
const db = require('models/index');

const authenticated = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];        
        if (!token) {
            return responseUtils.unauthorized(res, 'No token provided');
        }
        const decoded = jwt.verify(token, config.config.jwt.secret);
        console.log("Decoded token: ", decoded);
        if (!decoded || !decoded.userId) {
            console.log("Here");
            return responseUtils.unauthorized(res, 'Invalid token');
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
