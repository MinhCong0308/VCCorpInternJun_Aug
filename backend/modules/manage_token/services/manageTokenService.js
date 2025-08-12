const redis = require("utils/redisClient");
const { sign, signRefreshToken } = require("utils/jwtUtils");
const config = require('configs/index');
const jwt = require("jsonwebtoken");


const manageTokenServices = {
  async createToken(userId) {
    const accessToken = sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = signRefreshToken({ userId });
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
