const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../configs/jwt');
const responseUtils = require('utils/responseUtils');

const authenticated = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return responseUtils.unauthorized(res, 'No token provided');
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return responseUtils.unauthorized(res, 'Invalid token');
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return responseUtils.unauthorized(res, 'Unauthorized');
        }

        if (!roles.includes(req.user.role)) {
            return responseUtils.unauthorized(res, 'Forbidden: You do not have permission to access this resource');
        }

        next();
    };
};

module.exports = {
    authenticated,
    checkRole
};
