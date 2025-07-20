const { BodyWithLocale } = require("kernels/rules");
const db = require("models/index");
const comment = db.Comment;

const commentValidation = {
    create: [
        new BodyWithLocale("postId").notEmpty(),
        new BodyWithLocale("content").notEmpty().isString()
    ],
    update: [
        new BodyWithLocale("content").notEmpty().isString()
    ]
}
module.exports = commentValidation;
