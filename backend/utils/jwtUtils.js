const { config } = require("configs");
const jwt = require("jsonwebtoken");

module.exports = {
  sign: (userId, userRole) => {
    const access_token = jwt.sign(
      {
        userId: userId, // based on this
        role: userRole,
      },
      config.jwt.secret,
      {
        // expiresIn: config.jwt.ttl,
        expiresIn: '2m'
      }
    );

    return access_token;
  },
  signRefreshToken: (userId, userRole) => {
    const refresh_token = jwt.sign(
      {
        userId: userId,
        role: userRole,
      },
      config.jwt.secret,
      {
        expiresIn: "1w"
      }
    );

    return refresh_token;
  },
};
