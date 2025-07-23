const jwt = require("jsonwebtoken");
const responseUtils = require("utils/responseUtils");
const config = require("configs/index");
const postService = require("modules/post-owner/services/postService");
const db = require('models/index');


const postsController = {   
    createPost: async (req, res) => {
        try {
            const {title, content, languageid} = req.body;
            const data = await postService.createPost(title, content, userid, languageid);
            return responseUtils.ok(res, data);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
    deletePost: async (req, res) => {
        try {
            const token = req.headers.authorization?.split(" ")[1];
            const decoded = jwt.verify(token, config.config.jwt.secret);
            const userid = decoded.userId;
            const {postid} = req.body;
            const data = await postService.deletePost(postid, userid);
            return responseUtils.ok(res, data);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
    updatePost: async (req, res) => {
        try {
            const token = req.headers.authorization?.split(" ")[1];
            const decoded = jwt.verify(token, config.config.jwt.secret);
            const userid = decoded.userId;
            const {postid, newTitle, newContent} = req.body;
            const post = db.Post.findByPk(postid);
            if(post.userid != userid) {
                responseUtils.unauthorized(res, "This user cannot change content of this blog");
            }
            const data = await postService.updatePost(postid, newTitle, newContent);
            return responseUtils.ok(res, data);
        } catch(error) {
            return responseUtils.error(res, error.message);
        }
    },
    getAllPosts: async (req, res) => {
        // get userid from token
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, config.config.jwt.secret);
        const userid = decoded.userId;
        try {
            const data = await postService.getAllPosts(userid);
            return responseUtils.ok(res, data);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
};
module.exports = postsController;