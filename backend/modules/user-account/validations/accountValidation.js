const { BodyWithLocale } = require("kernels/rules");

const accountValidation = {
    updateUsername: [
        new BodyWithLocale("username").notEmpty()
    ],
    updateFullname: [
        new BodyWithLocale("newFullname").notEmpty(),
    ]
}
module.exports = accountValidation;