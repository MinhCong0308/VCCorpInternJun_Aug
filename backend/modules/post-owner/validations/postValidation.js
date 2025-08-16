const { BodyWithLocale } = require("kernels/rules");

const postValidation = {
    createPost: [
        new BodyWithLocale("originalPost").notEmpty(),
        new BodyWithLocale("originalPost.title").notEmpty(),
        new BodyWithLocale("originalPost.content").notEmpty(),
        new BodyWithLocale("originalPost.languageid").notEmpty(),
    ],
    deletePost: [
        new BodyWithLocale("postid").notEmpty().isNumberic()
    ],
    updatePost: [
        new BodyWithLocale("originalPost").notEmpty(),
        new BodyWithLocale("originalPost.title").notEmpty(),
        new BodyWithLocale("originalPost.content").notEmpty(),
        new BodyWithLocale("originalPost.languageid").notEmpty(),
    ],
    // getSpecificPost: [
    //     new BodyWithLocale("postid").notEmpty().isNumberic()
    // ]
};
module.exports = postValidation;