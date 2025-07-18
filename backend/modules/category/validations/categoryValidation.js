const {BodyWithLocale} = require("kernels/rules");
const db = require("models/index");
const category = db.Category;

const categoryValidation = {
    create: [
        new BodyWithLocale("categoryname").notEmpty().isString().unique(category, "categoryname")
    ],
    update: [
        new BodyWithLocale("categoryname").notEmpty().isString().unique(category, "categoryname")
    ]
};

module.exports = categoryValidation;