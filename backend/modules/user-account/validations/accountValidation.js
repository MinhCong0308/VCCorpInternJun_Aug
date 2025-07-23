const { BodyWithLocale } = require("kernels/rules");

const accountValidation = {
    updateUsername: [
        new BodyWithLocale("username").notEmpty()
    ],
    updateFullname: [
        new BodyWithLocale("newFullname").notEmpty(),
    ],
    updateAvatar: [
        new BodyWithLocale("avatarUrl").notEmpty()
    ]
};
module.exports = accountValidation;