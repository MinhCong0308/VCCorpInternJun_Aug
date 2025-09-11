const { sign, signRefreshToken } = require("utils/jwtUtils");
const bcrypt = require("bcryptjs");
const db = require("models/index");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
const redis = require("utils/redisClient");
const express = require("express");
require("dotenv").config();
const config = require("configs/index");
const authService = {
  async login(userInfo, roleId) {
    const { email, password } = userInfo;
    const user = await db.User.findOne({
      where: {
        [Op.and]: [
          { email: email },
          { status: config.config.statusenum.AUTHENTICATED },
        ],
      },
      include: [
        {
          model: db.Role,
          where: { roleid: roleId },
        },
      ],
    });
    if (!user) {
      throw new Error("Username or password is not correct");
    }
    // check password
    let isMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isMatch) {
      throw new Error("Username or password is not correct");
    }
    const accessToken = sign(user.userid, user.Role.rolename);
    const refreshToken = signRefreshToken(user.userid, user.Role.rolename);
    return {
      user: {
        userid: user.userid,
        email: user.email,
        username: user.username,
        role: user.Role.rolename,
      },
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  },
  async signup(userInfo) {
    const { firstName, lastName, username, email, password, confirmPassword } = userInfo;
    const existingUser = await db.User.findOne({
      where: {
        [Op.or]: [{ email: email }, { username: username }],
      },
    });
    if (existingUser) {
      throw new Error("Email or username is already registered.");
    }
    if (password != confirmPassword) {
      throw new Error("Password and confirm password must be identical");
    }
    // initialize a unauthenticated user
    const hashed_password = await bcrypt.hash(password, 10);
    const newUser = await db.User.create({
      firstname: firstName,
      lastname: lastName,
      username,
      email,
      hashed_password,
      status: config.config.statusenum.NON_AUTHENTICATED, // set it = NON_AUTHENTICATED, AUTHENTICATED just for testing for sign up functionality only
      roleid: config.config.roleenum.USER,
      last_login_at: new Date(),
    });
    return {
      email: email,
    };
  },
  async genOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
  },
  async sendOTP(email, otp) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "duckcode145@gmail.com",
        pass: process.env.APP_PASS,
      },
    });
    const mailOptions = {
      from: "duckcode145@gmail.com",
      to: email,
      subject: "OTP for email vertification",
      text: `Your OTP is: ${otp}, valid for 5 minutes.`,
    };
    return transporter.sendMail(mailOptions);
  },
  async requestOTP(email, isResetPassword = false) {
    const user = await db.User.findOne({ where: { email } });
    await redis.del(email);
    if(!isResetPassword) {
      if (!user || user.status !== config.config.statusenum.NON_AUTHENTICATED) {
        throw new Error("User not found or already verified.");
      }
    } else {
      if (!user || user.status !== config.config.statusenum.AUTHENTICATED) {
        throw new Error("User not found or not authenticated.");
      }
    }
    const otp = await this.genOTP();
    await redis.set(email, otp, { EX: 300 }); // 300s = 5 minutes
    await this.sendOTP(email, otp);
    console.log("OTP sent successfully");
  },
  async verifyOTP(email, inputOTP) {
    const storedOTP = await redis.get(email);
    if (!storedOTP) {
      throw new Error("OTP expired");
    }
    // console.log("Here is stored OTP: ", storedOTP);
    // console.log("Here is input OTP: ", inputOTP);
    if (storedOTP != inputOTP) {
      throw new Error("Invalid OTP.");
    }
    const user = await db.User.findOne({ where: { email } });
    user.status = config.config.statusenum.AUTHENTICATED; // update status of user to authenticated
    await user.save();
    // create user permission record
    // find user-permission first, if not exist, create one
    const userPermission = await db.UserPermission.findOne({ where: { userid: user.userid } });
    if (!userPermission) {
      await db.UserPermission.create({
        userid: user.userid,
        can_write_post: true,
        can_like_post: true,
        can_write_comment: true,
        can_edit_comment: true
      });
    }
    await redis.del(email);
    return { message: "Email verified successfully." };
  },
  async changePassword(userId, currentPassword, newPassword) {
    const user = await db.User.findOne({ where: { userid: userId } });
    if (!user) {
      throw new Error("User not found.");
    }
    const isMatch = await bcrypt.compare(currentPassword, user.hashed_password);
    if (!isMatch) {
      throw new Error("Current password is incorrect.");
    }
    const hashed_password = await bcrypt.hash(newPassword, 10);
    user.hashed_password = hashed_password;
    await user.save();
    return { message: "Password changed successfully." };
  },
  async resetPassword(email, newPassword, token) {
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      throw new Error("User not found.");
    }
    const storedToken = await redis.get(email);
    if (!storedToken) {
      throw new Error("Invalid or expired token.");
    }
    if (storedToken !== token) {
      throw new Error("Token mismatch.");
    }
    const hashed_password = await bcrypt.hash(newPassword, 10);
    user.hashed_password = hashed_password;
    await redis.del(email);
    await user.save();
    return { message: "Password reset successfully." };
  },
  async verifyForgetPassword(email) {
    const user = await db.User.findOne({ where: { email } });
    if (!user || user.status !== config.config.statusenum.AUTHENTICATED) {
      throw new Error("User not found or not authenticated.");
    }
    await redis.del(email);
    const base_url = process.env.RESET_PASSWORD_URL || 'http://localhost:4200/auth/reset-password?token=';
    const otp = await this.genOTP();
    await redis.set(email, otp, { EX: 300 }); // 300s = 5 minutes
    const resetLink = `${base_url}${otp}`;
    await this.sendOTP(email, resetLink);
    console.log("Password reset link sent successfully");
    return { message: "Password reset link sent to email, please use this link to access the reset page." };
  },
  async verifyResetPasswordToken(email, token) {
    const storedToken = await redis.get(email);
    if (!storedToken) {
      throw new Error("Invalid or expired token.");
    }
    if (storedToken !== token) {
      throw new Error("Token mismatch.");
    }
    // await redis.del(email);
    console.log("Token verified successfully");
    return { message: "Token verified successfully." };
  }
};
module.exports = authService;
