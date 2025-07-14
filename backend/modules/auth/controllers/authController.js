const responseUtils = require("utils/responseUtils");
const authService = require("modules/auth/services/authService");

const authController = {
    logIn: async (req, res) => {
        try {
            const userData = req.body;
            const data = await authService.login(userData);
            return responseUtils.ok(res, data);
        } catch(error) {
            if (error.message === "Email or password is not correct") {
                return responseUtils.unauthorized(res, error.message);
            }
            return responseUtils.error(res, error.message);
        }
    },
    signUp: async (req, res) => {
        try {
            const userData = req.body;
            console.log(userData);
            const data = await authService.signup(userData); 
            // await authService.requestOTP(userData.email);   
            return responseUtils.ok(res, {
                ...data,
                message: "User created. OTP sent for verification."
            });
        } catch (error) {
            if (error.message === "Email or username is already registered.") {
                return responseUtils.userError(res, error.message);
            }
            return responseUtils.error(res, error.message);
        }
    },
    verifyOTP: async (req, res) => {
        try {
            const {email, inputOTP} = req.body;
            if(!inputOTP || !email) {
                return responseUtils.error(res, {
                    message: "The email or OTP can not be empty"
                });
            }
            const verifyResult = await authService.verifyOTP(email, inputOTP);
            return responseUtils.ok(res, verifyResult);
        } catch(error) {
            return responseUtils.unauthorized(res, error.message);
        }
    }
};
module.exports = authController;