const { BodyWithLocale } = require("kernels/rules");
const db = require("models/index");
const user = db.User;

const userValidation = {
  create: [
    new BodyWithLocale("firstname").notEmpty().isString(),
    new BodyWithLocale("lastname").notEmpty().isString(),
    new BodyWithLocale("username").notEmpty().isString(),
    new BodyWithLocale("hashed_password").notEmpty().isString(),
    new BodyWithLocale("roleid").notEmpty().isString(),
    new BodyWithLocale("email").notEmpty().isEmail().unique(user, "email"),
  ],
  update: [
    new BodyWithLocale("firstname").notEmpty().isString(),
    new BodyWithLocale("lastname").notEmpty().isString(),
    new BodyWithLocale("username").notEmpty().isString(),
    new BodyWithLocale("hashed_password").notEmpty().isString(),
    new BodyWithLocale("roleid").notEmpty().isString(),
    new BodyWithLocale("email").notEmpty().isEmail().unique(user, "email"),
  ],
};
module.exports = userValidation;
