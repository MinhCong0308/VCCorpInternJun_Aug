const {sign, signRefreshToken} = require('utils/jwtUtils');
const bcrypt = require('bcryptjs');
const db = require('models/index');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const redis = require('utils/redisClient');
const express = require('express');
require("dotenv").config();
const config = require('configs/index');
const authService = {
    async login(userInfo) { // tested
        const {email, password} = userInfo;
        // console.log("Here ", config.config.statusenum.AUTHENTICATED);
        const user = await db.User.findOne({
            where: {
                [Op.and]: [
                { email: email },
                { status: config.config.statusenum.AUTHENTICATED}
                ]
            },
            include: [
                {
                    model: db.Role,
                    where: { roleid: config.config.roleenum.USER}
                }
            ]
        });
        if(!user) {
            return {
                status: config.config.statuscode.UNAUTHORIZED,
                success: false
            }
        }
        // check password
        let isMatch = await bcrypt.compare(password, user.hashed_password);
        if(!isMatch) {
            return {
                status: config.config.statuscode.UNAUTHORIZED,
                success: false
            }
        }
        const accessToken  = sign(user.userid, user.Role.rolename); 
        const refreshToken = signRefreshToken(user.userid, user.Role.rolename);
        return {
            user: {
                userid: user.userid,
                email: user.email,
                username: user.username,
                role: user.Role.rolename,
            },
            accessToken: accessToken,
            refreshToken: refreshToken
        };
    },
    async signup(userInfo) { // tested
        const {firstname, lastname, username, email, password, confirm_password} = userInfo;
        const existingUser = await db.User.findOne({
            where: {
                [Op.or] : [
                    {email: email}, 
                    {username: username}
                ]
            }
        });
        if(existingUser) {
            throw new Error("Email or username is already registered.");
        }
        if(password != confirm_password) {
            throw new Error("Password and confirm password must be identical");
        }
        // initialize a unauthenticated user
        const hashed_password = await bcrypt.hash(password, 10)
        const newUser = await db.User.create({
            firstname,
            lastname,
            username,
            email,
            hashed_password,
            status: config.config.statusenum.NON_AUTHENTICATED, // set it = NON_AUTHENTICATED, AUTHENTICATED just for testing for sign up functionality only
            roleid: config.config.roleenum.USER,
            last_login_at: new Date()
        })
        return {
            message: "User created. Please verify your email with OTP.",
            email: email
        };
    },
    async genOTP() {
        const otp = Math.floor(100000 + Math.random() * 900000);
        return otp;
    },
    async sendOTP(email, otp) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "duckcode145@gmail.com",
                pass: process.env.APP_PASS  
            }
        });
        const mailOptions = {
            from: "duckcode145@gmail.com",
            to: email,
            subject: "OTP for email vertification",
            text: `Your OTP is: ${otp}, valid for 5 minutes.`,
        };
        return transporter.sendMail(mailOptions);
    },
    async requestOTP(email) {
        const user = await db.User.findOne({ where: { email } });
        if (!user || user.status !== config.config.statusenum.NON_AUTHENTICATED) {
            throw new Error("User not found or already verified.");
        }
        const otp = await this.genOTP();
        await redis.set(email, otp, {EX: 300}); // 300s = 5 minitues
        await this.sendOTP(email, otp);
    },
    async verifyOTP(email, inputOTP) {
        const storedOTP = await redis.get(email);
        if(!storedOTP) {
            throw new Error("OTP expired");
        }
        // console.log("Here is stored OTP: ", storedOTP);
        // console.log("Here is input OTP: ", inputOTP);
        if(storedOTP != inputOTP) {
            throw new Error("Invalid OTP.");
        }
        const user = await db.User.findOne({where: {email}});
        user.status = config.config.statusenum.AUTHENTICATED; // update status of user to authenticated
        await user.save();
        await redis.del(email);
        return { message: "Email verified successfully." };
    }
};
module.exports = authService;