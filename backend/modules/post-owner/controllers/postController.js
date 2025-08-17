const jwt = require("jsonwebtoken");
const responseUtils = require("utils/responseUtils");
const config = require("configs/index");
const postService = require("modules/post-owner/services/postService");
const db = require("models/index");

const postsController = {   
    createPost: async (req, res) => {
        try {
            const {originalPost, translations} = req.body;
            const userid = req.user.userid; // Get userid from authenticated user
            const data = await postService.createPost(originalPost, translations, userid);
            return responseUtils.ok(res, data);
        } catch (error) {
            console.error("Error creating post:", error);
            return responseUtils.error(res, error.message);
        }
    },
    deletePost: async (req, res) => {
        try {
            const userid = req.user.userid; // Get userid from authenticated user
            const {postid} = req.params;
            console.log("Deleting post with ID:", postid, "for user ID:", userid);
            const data = await postService.deletePost(postid, userid);
            return responseUtils.ok(res, data);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
    updatePost: async (req, res) => {
        try {
            const userid = req.user.userid; // Get userid from authenticated user
            console.log("Userid:", userid);
            const {originalPost, translations, postid} = req.body;
            const data = await postService.updatePost(originalPost, translations, userid, postid);
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
            // console.log("Data retrieved successfully:", data);
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
    },
    translatePost: async (req, res) => {    
        try{
            const userid = req.user.userid;
            const { text, sourceLanguage, targetLanguage} = req.body;
            const translatedText = await postService.translate(text, sourceLanguage, targetLanguage);
            return responseUtils.ok(res, translatedText);
        } catch (error) {
            console.error("Error translating post:", error);
            return responseUtils.error(res, error.message);
        }
    },
    getTranslationForPost: async (req, res) => {
        const { postid } = req.params;
        try {
            const data = await postService.getTranslationForPost(postid);
            return responseUtils.ok(res, data);
        } catch (error) {
            console.error("Error retrieving translations for post:", error);
            return responseUtils.error(res, error.message);
        }
    }
};
module.exports = postsController;
