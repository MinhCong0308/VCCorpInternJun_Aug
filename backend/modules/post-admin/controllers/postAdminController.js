const responseUtils = require("utils/responseUtils");
const postAdminService = require("modules/post-admin/services/postAdminService");

const postAdminController = {
    getPostList: async (req, res) => {
        try {
            const { categoryId, status, userId, languageId, limit = 5, page = 1, search = '' } = req.query;
            const posts = await postAdminService.getPostList(categoryId, status, userId, languageId, +limit, +page, search);
            return responseUtils.ok(res, posts);
        } catch (error) {
            console.error("Error fetching posts:", error);
            const message = "An error occurred while fetching posts";
            return responseUtils.error(res, message);
        }
    },
    getPostDetail: async (req, res) => {
        try {
            const { postId } = req.params;
            const post = await postAdminService.getPostDetail(postId);
            return responseUtils.ok(res, post);
        } catch (error) {
            console.error("Error fetching post detail:", error);
            return responseUtils.error(res, error.message);
        }
    },
    approvePost: async (req, res) => {
        try {
            const { postId } = req.params;
            const updatedPost = await postAdminService.approvePost(postId);
            return responseUtils.ok(res, updatedPost);
        } catch (error) {
            console.error("Error approving post:", error);
            return responseUtils.error(res, error.message);
        }
    },
    rejectPost: async (req, res) => {
        try {
            const { postId } = req.params;
            const updatedPost = await postAdminService.rejectPost(postId);
            return responseUtils.ok(res, updatedPost);
        } catch (error) {
            console.error("Error rejecting post:", error);
            return responseUtils.error(res, error.message);
        }
    }
}

module.exports = postAdminController;