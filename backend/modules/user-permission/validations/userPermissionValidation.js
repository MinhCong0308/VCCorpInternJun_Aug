const { BodyWithLocale } = require("kernels/rules");

const userPermissionValidation = {
    update: [
        new BodyWithLocale("can_write_post").isBoolean().notEmpty(),
        new BodyWithLocale("can_like_post").isBoolean().notEmpty(),
        new BodyWithLocale("can_write_comment").isBoolean().notEmpty(),
        new BodyWithLocale("can_edit_comment").isBoolean().notEmpty(),
    ],
};
module.exports = userPermissionValidation;
