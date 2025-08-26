const { BodyWithLocale } = require("kernels/rules");
const db = require("models/index");
const user = db.User;

const userValidation = {
  create: [
    new BodyWithLocale("firstname")
      .notEmpty()
      .isString()
      .isLength({ min: 2, max: 50 }),
    new BodyWithLocale("lastname")
      .notEmpty()
      .isString()
      .isLength({ min: 2, max: 50 }),
    new BodyWithLocale("username")
      .notEmpty()
      .isString()
      .isLength({ min: 3, max: 30 }),
    new BodyWithLocale("hashed_password")
      .notEmpty()
      .isString()
      .isLength({ min: 6 }),
    new BodyWithLocale("roleid").notEmpty().isString(),
    new BodyWithLocale("email").notEmpty().isEmail().unique(user, "email"),
  ],
};
module.exports = userValidation;
