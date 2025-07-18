const {BodyWithLocale} = require("kernels/rules");
const db = require("models/index");
const comment = db.Comment;

const { body } = require('express-validator');

const commentValidation = {
    create: [
        body('postId')
            .notEmpty().withMessage('postId is required')
            .isInt({ min: 1 }).withMessage('postId must be a positive integer'),
        body('content')
            .notEmpty().withMessage('content is required')
            .isString().withMessage('content must be a string'),
        body('parentId')
            .optional()
            .isInt({ min: 1 }).withMessage('parentId must be a positive integer')
            .custom(async (parentId, { req }) => {
                if (parentId) {
                    const parent = await comment.findByPk(parentId);
                    if (!parent) throw new Error('parentId does not exist');
                    if (parent.postId !== req.body.postId) throw new Error('parentId does not belong to this post');
                }
                return true;
            })
    ],
    update: [
        body('content')
            .optional()
            .isString().withMessage('content must be a string'),
        body('postId').not().exists().withMessage('Cannot update postId'),
        body('parentId').not().exists().withMessage('Cannot update parentId')
    ]
};
