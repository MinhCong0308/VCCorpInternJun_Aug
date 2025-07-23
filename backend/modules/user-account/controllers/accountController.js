const responseUtils = require("utils/responseUtils");
const accountService = require("modules/user-account/services/accountService");
const jwt = require("jsonwebtoken");
const config = require("configs/index");
const { update } = require("modules/category/validations/categoryValidation");

const accountController = {
    updateUsername: async(req, res) => {
        try {
            const {username} = req.body;
            const token = req.headers.authorization?.split(" ")[1];
            const decoded = jwt.verify(token, config.config.jwt.secret);
            const userid = decoded.userId;
            const data = await accountService.updateUsername(username, userid);
            console.log("Data: ", data);
            return responseUtils.ok(res, data);
        } catch(error) {
            return responseUtils.error(res, error.message);
        }
    },
    updateFullname: async(req, res) => {
        try {
            const {newFullname} = req.body;
            const userid = jwt.verify(req.headers.authorization.split(" ")[1], config.config.jwt.secret).userId;   
            const data = await accountService.updateFullname(newFullname, userid);
            return responseUtils.ok(res, data);
        } catch(error) {
            return responseUtils.unauthorized(res, error.message);
        }
    },
    deactivateAccount: async(req, res) => {
        try {
            const userid = jwt.verify(req.headers.authorization.split(" ")[1], config.config.jwt.secret).userId;
            const data = await accountService.deactivateAccount(userid);
            return responseUtils.ok(res, data);
        } catch(error) {
            return responseUtils.unauthorized(res, error.message);
        }
    },
    updateAvatar: async(req, res) => {
        try {
            if(!req.file) {
                return responseUtils.error(res, "No file uploaded");
            }
            const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;
            console.log("Avatar URL: ", avatarUrl);
            if (!avatarUrl) {
                return responseUtils.error(res, "Avatar URL is required");
            }
            const userid = jwt.verify(req.headers.authorization.split(" ")[1], config.config.jwt.secret).userId;
            const data = await accountService.updateAvatar(avatarUrl, userid);
            return responseUtils.ok(res, data);
        } catch(error) {
            return responseUtils.unauthorized(res, error.message);
        }
    }
};
module.exports = accountController;