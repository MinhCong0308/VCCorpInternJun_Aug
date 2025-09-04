const { BodyWithLocale } = require("kernels/rules");
const db = require("models/index");
const dictionary = db.Dictionary;

const dictionaryValidation = {
  create: [
    new BodyWithLocale("word")
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 191 })
      .unique(dictionary, "word"),
  ],
  // update now only for locale (and maybe future fields); word cannot be changed
};

module.exports = dictionaryValidation;
