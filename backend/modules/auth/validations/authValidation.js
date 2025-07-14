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
        new BodyWithLocale("otp").notEmpty().isNumberic(),
        new BodyWithLocale("email").notEmpty().isEmail()
    ]
};
module.exports = authValidation;