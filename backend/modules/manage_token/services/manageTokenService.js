const redis = require("utils/redisClient");
const { sign, signRefreshToken } = require("utils/jwtUtils");
const config = require('configs/index');
const jwt = require("jsonwebtoken");
const db = require("models/index");


const manageTokenServices = {
  async createToken(userId) {
    const user = await db.User.findByPk(userId, {
      include: [{
        model: db.Role,
        attributes: ['rolename'],
        as: 'Role'
      }]
    });
    const accessToken = sign(user.userid, user.Role.rolename);
    const refreshToken = signRefreshToken(user.userid);
    return {
        accessToken: accessToken,
        refreshToken: refreshToken
    };
  },
  async revokeToken(type, token) {
    const exp = jwt.verify(token, config.config.jwt.secret).exp;
    await redis.set(`blacklist:${type}:${token}`, exp);
  },
  async isTokenRevoked(type, token) {
    const isRevoked = await redis.get(`blacklist:${type}:${token}`);
    return isRevoked !== null;
  },
  async refreshToken(userId) {
    const newToken = await this.createToken(userId);
    return newToken;
  }
};
module.exports = manageTokenServices;
