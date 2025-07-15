const { BodyWithLocale } = require("kernels/rules");

const languageValidation = {
    create: [
        new BodyWithLocale("name").notEmpty().isString(),
        new BodyWithLocale("code").notEmpty().isString()
    ],
    update: [new BodyWithLocale("name").notEmpty().isString(),
    new BodyWithLocale("code").notEmpty().isString()
    ]
}