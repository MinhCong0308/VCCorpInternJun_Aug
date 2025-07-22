const responseUtils = require("utils/responseUtils");
const postService = require("modules/post/services/postService");

const postController = {
    getPublishedPosts: async (req, res) => {
        try {
            const { categoryId, userId, languageId, limit = 5, page = 1, search = '' } = req.query;
            const posts = await postService.getPostList(categoryId, userId, languageId, +limit, +page, search);
            return responseUtils.ok(res, posts);
        } catch (error) {
            console.error("Error fetching posts:", error);
            const message = "An error occurred while fetching posts";
            return responseUtils.error(res, message);
        }
    },
    getPublishedPostDetail: async (req, res) => {
        try {
            const { postId } = req.params;
            const post = await postService.getPublishedPostDetail(postId);
            return responseUtils.ok(res, post);
        } catch (error) {
            console.error("Error fetching post detail:", error);
            return responseUtils.error(res, error.message);
        }
    }
}

module.exports = postController;