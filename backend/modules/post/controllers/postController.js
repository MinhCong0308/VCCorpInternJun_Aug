// const responseUtils = require("utils/responseUtils");
// const postService = require("modules/post/services/postService");

// const postController = {
//     getAll: async (req, res) => {
//         try {
//             const {limit = 5, page = 1} = req.query;
//             const posts = await postService.getAllPosts(+limit, +page);
//             return responseUtils.ok(res, posts);
//         } catch (error) {
//             return responseUtils.error(res, error.message);
//         }
//     }
// }