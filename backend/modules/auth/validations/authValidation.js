const { BodyWithLocale } = require("kernels/rules");
const { reset } = require("leo-profanity"); 

const authValidation = {
  logIn: [
    new BodyWithLocale("email").notEmpty().isEmail(),
    new BodyWithLocale("password").notEmpty(),
  ],
  signUp: [
    new BodyWithLocale("firstName").notEmpty(),
    new BodyWithLocale("lastName").notEmpty(),
    new BodyWithLocale("email").notEmpty().isEmail(),
    new BodyWithLocale("username").notEmpty(),
    new BodyWithLocale("password").notEmpty().isLength({ min: 5 }),
    new BodyWithLocale("confirmPassword").notEmpty().confirmed("password"),
  ],
  verifyOTP: [
    new BodyWithLocale("inputOTP").notEmpty().isLength({ min: 6, max: 6 }),
    new BodyWithLocale("email").notEmpty().isEmail(),
  ],
  resendOTP: [
    new BodyWithLocale("email").notEmpty().isEmail(),
  ],
  // verifyResetPassword: [new BodyWithLocale("email").notEmpty().isEmail()],
  resetPassword: [
    new BodyWithLocale("email").notEmpty().isEmail(),
    new BodyWithLocale("newPassword").notEmpty().isLength({ min: 5 }),
    new BodyWithLocale("newPasswordConfirm").notEmpty().confirmed("newPassword"),
  ],
};
module.exports = authValidation;
