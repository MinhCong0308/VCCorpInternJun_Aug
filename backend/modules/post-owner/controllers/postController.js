const jwt = require("jsonwebtoken");
const responseUtils = require("utils/responseUtils");
const config = require("configs/index");
const postService = require("modules/post-owner/services/postService");
const db = require("models/index");

const postsController = {   
    createPost: async (req, res) => {
        try {
            const {title, content, languageid, tags} = req.body;
            const userid = req.user.userid; // Get userid from authenticated user
            const data = await postService.createPost(title, content, userid, languageid, tags);
            return responseUtils.ok(res, data);
        } catch (error) {
            console.error("Error creating post:", error);
            return responseUtils.error(res, error.message);
        }
    },
    deletePost: async (req, res) => {
        try {
            const userid = req.user.userid; // Get userid from authenticated user
            const {postid} = req.body;
            const data = await postService.deletePost(postid, userid);
            return responseUtils.ok(res, data);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
    updatePost: async (req, res) => {
        try {
            const userid = req.user.userid; // Get userid from authenticated user
            const {postid, title, content, languageid, tags} = req.body;
            const data = await postService.updatePost(postid, title, content, userid, languageid, tags);
            return responseUtils.ok(res, data);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
    getAllPosts: async (req, res) => {
        // get userid from token
        const userid = req.user.userid; // Get userid from authenticated user
        try {
            const data = await postService.getAllPosts(userid);
            return responseUtils.ok(res, data);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
    getSpecificPost: async (req, res) => {
        const userid = req.user.userid;
        const { postid } = req.params;
        try {
            const data = await postService.getSpecificPost(postid, userid);
            console.log("Data retrieved successfully:", data);
            return responseUtils.ok(res, data);
        }
        catch (error) {
            console.error("Error retrieving specific post:", error);
            return responseUtils.error(res, error.message);
        }
    }
};
module.exports = postsController;
