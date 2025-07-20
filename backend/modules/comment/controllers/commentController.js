const responseUtils = require("utils/responseUtils");
const commentService = require("modules/comment/services/commentService");

const commentController = {
    getAll: async (req, res) => {
        try {
            const { postId } = req.query;
            if (!postId) {
                return responseUtils.error(res, "Missing postId");
            }
            const comments = await commentService.getCommentsByPost(postId);
            return responseUtils.ok(res, comments);
        } catch (error) {
            console.error("Error fetching comments:", error);
            const message = "An error occurred while fetching comments";
            return responseUtils.error(res, message);
        }
    },
    create: async (req, res) => {
        try {
            const commentData = req.body;
            if (!commentData.postId) {
                return responseUtils.error(res, "Missing postId");
            }
            const newComment = await commentService.createComment(commentData);
            return responseUtils.ok(res, newComment);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
    update: async (req, res) => {
        try {
            const { commentId } = req.params;
            if (!commentId) {
                return responseUtils.error(res, "Missing commentId");
            }
            const commentData = req.body;
            const updatedComment = await commentService.updateComment(commentId, commentData);
            return responseUtils.ok(res, updatedComment);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    }
}

module.exports = commentController;