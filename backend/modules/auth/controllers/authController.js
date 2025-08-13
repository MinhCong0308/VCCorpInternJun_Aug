const responseUtils = require("utils/responseUtils");
const authService = require("modules/auth/services/authService");
require("dotenv").config();
const config = require("configs/index");
const manageTokenServices = require("modules/manage_token/services/manageTokenService");
const authController = {
  logIn: async (req, res) => {
    try {
      const userData = req.body;
      const data = await authService.login(
        userData,
        config.config.roleenum.USER
      );
      res.cookie("accessToken", data.accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 3600000, // 1 hour
      });
      res.cookie("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 604800000, // 1 week
      });
      return responseUtils.ok(res, data.user);
    } catch (error) {
      console.error("Login error: ", error);
      return responseUtils.unauthorized(res, error.message);
    }
  },
  logInAdmin: async (req, res) => {
    try {
      const adminData = req.body;
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
      return responseUtils.ok(res, {data, message: "User created. Please verify your email with OTP."});
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
  getSessionInfo: async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return responseUtils.unauthorized(res, {});
      }
      const userData = {
        userid: user.userid,
        email: user.email,
        username: user.username,
        role: user.Role.rolename,
      }
      return responseUtils.ok(res, userData);
    } catch(err) {
      console.log("ERROR");
      console.error("getSessionInfo error:", err);
      return responseUtils.unauthorized(res, "Invalid session");
    }
  },
  logout: async (req, res) => {
    try {
      const accessToken = req.cookies.accessToken;
      const refreshToken = req.cookies.refreshToken;
      await manageTokenServices.revokeToken("access", accessToken);
      await manageTokenServices.revokeToken("refresh", refreshToken);
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return responseUtils.ok(res, { message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      return responseUtils.unauthorized(res, "Logout failed");
    }
  }
};
module.exports = authController;
