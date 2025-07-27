const responseUtils = require("utils/responseUtils");
const authService = require("modules/auth/services/authService");
require("dotenv").config();
const config = require("configs/index");

const authController = {
  logIn: async (req, res) => {
    try {
      const userData = req.body;
      const data = await authService.login(
        userData,
        config.config.roleenum.USER
      );
      return responseUtils.ok(res, data);
    } catch (error) {
      console.error("Login error: ", error);
      return responseUtils.unauthorized(res, error.message);
    }
  },
  logInAdmin: async (req, res) => {
    try {
      const adminData = req.body;
      // Gọi service với vai trò ADMIN
      const data = await authService.login(
        adminData,
        config.config.roleenum.ADMIN
      );
      return responseUtils.ok(res, data);
    } catch (error) {
      console.error("Admin Login error: ", error);
      return responseUtils.unauthorized(res, error.message);
    }
  },
  signUp: async (req, res) => {
    try {
      const userData = req.body;
      console.log(userData);
      const data = await authService.signup(userData);
      await authService.requestOTP(userData.email);
      return responseUtils.ok(res, {
        ...data,
        message: "User created. OTP sent for verification.",
      });
    } catch (error) {
      return responseUtils.unauthorized(res, error.message);
    }
  },
  verifyOTP: async (req, res) => {
    try {
      const { email, inputOTP } = req.body;
      if (!inputOTP || !email) {
        return responseUtils.error(res, {
          message: "The email or OTP can not be empty",
        });
      }
      const verifyResult = await authService.verifyOTP(email, inputOTP);
      return responseUtils.ok(res, verifyResult);
    } catch (error) {
      return responseUtils.unauthorized(res, error.message);
    }
  },
};
module.exports = authController;
