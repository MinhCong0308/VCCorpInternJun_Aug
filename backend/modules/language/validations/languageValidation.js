const { BodyWithLocale } = require("kernels/rules");

const languageValidation = {
    create: [
        new BodyWithLocale("languagename").notEmpty().isString(),
        new BodyWithLocale("locale_code").notEmpty().isString()
    ],
    update: [new BodyWithLocale("languagename").notEmpty().isString(),
    new BodyWithLocale("locale_code").notEmpty().isString()
    ]
}
module.exports = languageValidation;