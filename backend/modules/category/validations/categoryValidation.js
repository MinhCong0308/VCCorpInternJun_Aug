const { BodyWithLocale } = require("kernels/rules");
const db = require("models/index");
const category = db.Category;

const categoryValidation = {
  create: [
    new BodyWithLocale("categoryname")
      .notEmpty()
      .isString()
      .isLength({ min: 2, max: 150 })
      .unique(category, "categoryname"),
  ],
  update: [
    new BodyWithLocale("categoryname")
      .notEmpty()
      .isString()
      .isLength({ min: 2, max: 150 }),
  ],
};

module.exports = categoryValidation;
