const { sign, signRefreshToken } = require("utils/jwtUtils");
const db = require("models/index");
const { Op } = require("sequelize");
const config = require("configs/index");
const crypto = globalThis.crypto || require("node:crypto").webcrypto;
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const oauthService = {
    async handleOAuthSuccess(profile) {
        // Extract user information from profile
        const userInfo = this.extractUserInfo(profile);
        const {firstName, lastName, email, username} = userInfo;
        let user;
        user = await db.User.findOne({
            where: {
                email: email,
            }
        });
        if (!user) {
            const password = this.generateRandomPassword(16);
            const hashedPassword = await bcrypt.hash(password, 10);
            // create user
            const newUser = await db.User.create({
                firstname: firstName,
                lastname: lastName,
                username: username,
                email: email,
                hashed_password: hashedPassword, // Store the random password
                status: config.config.statusenum.AUTHENTICATED,
                roleid: config.config.roleenum.USER,
                last_login_at: new Date(),
            });
            console.log("New user created:", newUser);
            await this.sendWelcomeEmail(newUser.email, password);
        }
        user = await db.User.findOne({
            where: {
                email: email,
                status: config.config.statusenum.AUTHENTICATED
            },
            include: [
                {
                    model: db.Role,
                    where: { roleid: config.config.roleenum.USER }
                }
            ]
        });
        const accessToken = sign(user.userid, user.Role.rolename);
        const refreshToken = signRefreshToken(user.userid, user.Role.rolename);

        return {
            user: {
                userid: user.userid,
                email: user.email,
                username: user.username,
                role: user.Role.rolename
            },
            accessToken: accessToken,
            refreshToken: refreshToken
        };
    },
    generateRandomPassword(length) {
        const lower = "abcdefghijklmnopqrstuvwxyz";
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const digits = "0123456789";
        const special = "!@#$%^&*()-_=+[]{}|:,.<>?";
        const all = lower + upper + digits + special;   
        const pwdArray = new Uint32Array(length);
        crypto.getRandomValues(pwdArray);   
        return Array.from(pwdArray, n => all[n % all.length]).join("");
    },
    async sendWelcomeEmail(email, password) {
        // Implement email sending logic here
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "duckcode145@gmail.com",
                pass: process.env.APP_PASS,
            },
        });

        const mailOptions = {
            from: "duckcode145@gmail.com",
            to: email,
            subject: 'Welcome to Our Service',
            text: `Welcome! Your account has been created. Your temporary password is: ${password}`,
        };

        await transporter.sendMail(mailOptions);
    },
    extractUserInfo(profile) {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const username = profile.displayName || profile.username || `${this.provider}_${profile.id}`;
        const firstName = profile.name?.givenName || '';
        const lastName = profile.name?.familyName || '';
        const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

        return {
            email,
            username,
            firstName,
            lastName,
            avatarUrl
        };
    }
};

module.exports = oauthService;
