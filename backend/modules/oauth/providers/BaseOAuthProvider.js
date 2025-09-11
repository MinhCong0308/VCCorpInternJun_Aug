const db = require("models/index");
const config = require("configs/index");
const bcrypt = require("bcryptjs");
const emailService = require("modules/oauth/services/emailService");

class BaseOAuthProvider {
  constructor(providerName) {
    this.providerName = providerName;
    
    if (this.constructor === BaseOAuthProvider) {
      throw new Error("BaseOAuthProvider is abstract and cannot be instantiated directly");
    }
  }
  
  // template method
  async processOAuthProfile(profile) {
    const userInfo = this.extractUserInfo(profile);
    console.log(`[${this.providerName} OAuth] Extracted user info:`, userInfo);
    let user = await this.findExistingUser(userInfo.email);
    console.log("Existing user found:", user);
    if (!user) {
      user = await this.createNewUser(userInfo);
    }
    const tokens = await this.generateTokens(user);
    console.log(`[${this.providerName} OAuth] Generated tokens for user:`, tokens);
    return tokens;
  }
  
  // abstract method to be implemented by subclasses
  extractUserInfo(profile) {
    throw new Error("extractUserInfo must be implemented by subclass");
  }
  
  // Default implementation that can be overridden
  async findExistingUser(email) {
    return await db.User.findOne({
      where: { email },
      include: [{ model: db.Role }]
    });
  }
  
  async createNewUser(userInfo) {
    const { email, username, firstName, lastName, avatarUrl } = userInfo;
    const password = this.generateRandomPassword(16);
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.User.create({
      firstname: firstName,
      lastname: lastName,
      username: username,
      email: email,
      avatar_url: avatarUrl,
      hashed_password: hashedPassword,
      status: config.config.statusenum.AUTHENTICATED,
      roleid: config.config.roleenum.USER,
      last_login_at: new Date(),
    });
    // default permissions for user
    await this.createDefaultPermissions(newUser.userid);
    // Send welcome email
    await emailService.sendWelcomeEmail(email, password);
    return await db.User.findOne({
      where: { userid: newUser.userid },
      include: [{ model: db.Role }]
    });
  }
  
  async createDefaultPermissions(userid) {
    await db.UserPermission.create({
      userid,
      can_write_post: true,
      can_like_post: true,
      can_write_comment: true,
      can_edit_comment: true
    });
  }
  
  async generateTokens(user) {
    const { sign, signRefreshToken } = require("utils/jwtUtils");
  
    const accessToken = sign(user.userid, user.Role.rolename);
    const refreshToken = signRefreshToken(user.userid, user.Role.rolename);
    
    return {
      user: {
        userid: user.userid,
        email: user.email,
        username: user.username,
        role: user.Role.rolename,
      },
      accessToken,
      refreshToken
    };
  }
  
  generateRandomPassword(length) {
    const crypto = globalThis.crypto || require("node:crypto").webcrypto;
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const special = "!@#$%^&*()-_=+[]{}|:,.<>?";
    const all = lower + upper + digits + special;
    
    const pwdArray = new Uint32Array(length);
    crypto.getRandomValues(pwdArray);
    
    return Array.from(pwdArray, n => all[n % all.length]).join("");
  }
}

module.exports = BaseOAuthProvider;