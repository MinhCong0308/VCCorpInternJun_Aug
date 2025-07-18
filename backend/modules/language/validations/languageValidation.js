const { BodyWithLocale } = require("kernels/rules");
const db = require("models/index");
const language = db.Language;

const languageValidation = {
    create: [
        new BodyWithLocale("languagename").notEmpty().isString().unique(language, "languagename"),
        new BodyWithLocale("locale_code").notEmpty().isString().unique(language, "locale_code")
    ],
    update: [new BodyWithLocale("languagename").notEmpty().isString().unique(language, "languagename"),
    new BodyWithLocale("locale_code").notEmpty().isString().unique(language, "locale_code")
    ]
}
module.exports = languageValidation;