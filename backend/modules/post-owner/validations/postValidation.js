const { BodyWithLocale } = require("kernels/rules");

const postValidation = {
    createPost: [
        new BodyWithLocale("title").notEmpty().isString(),
        new BodyWithLocale("content").notEmpty(),
        new BodyWithLocale("languageid").notEmpty().isNumberic()
    ],
    deletePost: [
        new BodyWithLocale("postid").notEmpty().isNumberic()
    ],
    updatePost: [
        new BodyWithLocale("postid").notEmpty().isNumberic(),
        new BodyWithLocale("title").notEmpty(),
        new BodyWithLocale("content").notEmpty()
    ]
};
module.exports = postValidation;