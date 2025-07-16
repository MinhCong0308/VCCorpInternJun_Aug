const {BodyWithLocale} = require("kernels/rules");

const categoryValidation = {
    create: [
        new BodyWithLocale("categoryname").notEmpty().isString()
    ],
    update: [
        new BodyWithLocale("categoryname").notEmpty().isString()
    ]
};

module.exports = categoryValidation;