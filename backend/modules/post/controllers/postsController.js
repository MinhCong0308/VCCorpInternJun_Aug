const responseUtils = require("utils/responseUtils");
const postsService = require("modules/post/services/postsService");
const MAX_LIKES_PER_REQUEST = 100; // giới hạn mỗi lần được gửi tối đa 100 likes

function parseCount(input) {
  if (input === undefined || input === null || input === '') return 1;
  const n = Number.parseInt(input, 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) return 1;
  return Math.max(1, Math.min(n, MAX_LIKES_PER_REQUEST)); // clamp [1..100]
}

const postsController = {
    getPublishedPosts: async (req, res) => {
        try {
            const { categoryId, userId, languageId, limit = 5, page = 1, search = '' } = req.query;
            const posts = await postsService.getPublishedPosts(categoryId, userId, languageId, +limit, +page, search);
            return responseUtils.ok(res, posts);
        } catch (error) {
            console.error("Error fetching posts:", error);
            const message = "An error occurred while fetching posts";
            return responseUtils.error(res, message);
        }
    },
    getPublishedPostsTrending: async (req, res) => {
        try {
            const { categoryId, userId, languageId, limit = 5, page = 1, search = '' } = req.query;
            const posts = await postsService.getPublishedPostsTrending(categoryId, userId, languageId, +limit, +page, search);
            return responseUtils.ok(res, posts);
        } catch (error) {
            console.error("Error fetching trending posts:", error);
            const message = "An error occurred while fetching trending posts";
            return responseUtils.error(res, message);
        }
    },
    getPublishedPostDetail: async (req, res) => {
        try {
            const { postId } = req.params;
            const post = await postsService.getPublishedPostDetail(postId);
            return responseUtils.ok(res, post);
        } catch (error) {
            console.error("Error fetching post detail:", error);
            return responseUtils.error(res, error.message);
        }
    },
    likePost: async (req, res) => {
        try {
            const { postId } = req.params;
            const countRaw = (req.query && req.query.count) ?? (req.body && req.body.count);
            const count = parseCount(countRaw);
            const updatedPost = await postsService.likePost(postId, count);
            return responseUtils.ok(res, updatedPost);
        } catch (error) {
            console.error("Error liking post:", error);
            return responseUtils.error(res, error.message);
        }
    },
    unlikePost: async (req, res) => {
        try {
            const { postId } = req.params;
            const updatedPost = await postsService.unlikePost(postId);
            return responseUtils.ok(res, updatedPost);
        } catch (error) {
            console.error("Error unliking post:", error);
            return responseUtils.error(res, error.message);
        }
    }
}

module.exports = postsController;