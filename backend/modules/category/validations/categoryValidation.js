const {BodyWithLocale} = require("kernels/rules");

const categoryValidation = {
    create: [
        new BodyWithLocale("name").notEmpty().isString()
    ],
    update: [
        new BodyWithLocale("name").notEmpty().isString()
    ]
};

module.exports = categoryValidation;