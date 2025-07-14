const { BodyWithLocale } = require("kernels/rules");
const db = require("models/index");

const authValidation = {
    logIn: [
        new BodyWithLocale("email").notEmpty().isEmail(),
        new BodyWithLocale("password").notEmpty()
    ],
    signUp: [
        new BodyWithLocale("firstname").notEmpty().isString(),
        new BodyWithLocale("lastname").notEmpty().isString(),
        new BodyWithLocale("email").notEmpty().isEmail(),
        new BodyWithLocale("password").notEmpty().isLength({min: 5}),
        new BodyWithLocale("confirm_password").notEmpty().confirmed("password")
    ],
    verifyOTP: [
        new BodyWithLocale("inputOTP").notEmpty().isLength({ min: 6, max: 6 }),
        new BodyWithLocale("email").notEmpty().isEmail()
    ]
};
module.exports = authValidation;