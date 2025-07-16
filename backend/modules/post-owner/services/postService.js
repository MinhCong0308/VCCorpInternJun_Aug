const db = require('models/index');
const config = require('configs/index');
const { Op } = require('sequelize');

const postService = {
    createPost: async (title, content, userid, languageid) => {
        const user = await db.User.findOne({
            where: {[Op.and]: [
                {userid: userid}, {status: config.config.statusenum.AUTHENTICATED}
            ]},
        });
        if (!user) {
            throw new Error("User not found or not authorized");
        }
        try {
            const post = await db.Post.create({
                userid,
                languageid,
                title,
                content,
                status: config.config.statuspostenum.PENDING
            });
            post.original_postid = post.postid;
            console.log("Post created successfully:", post);    
            await post.save();
            return { message: "Post created successfully", post };
        } catch (error) {
            throw new Error("Error creating post");
        }
    },
    deletePost: async (postid, userid) => {
        // check for valid user
        const user = await db.User.findOne({
            where: {[Op.and]: [
                {userid: userid}, {status: config.config.statusenum.AUTHENTICATED}
            ]},
        });
        if (!user) {
            throw new Error("User not found or not authorized");
        }
        const post = await db.Post.findByPk(postid);
        if (!post) {
            throw new Error("Post not found");
        }
        if (post.userid !== userid) {
            throw new Error("You are not authorized to delete this post");
        }
        await post.destroy();
        return { message: "Post deleted successfully" };
    },
    updatePost: async (postid, newTitle, newContent) => {
        const post = db.Post.findByPk(postid);
        post.title = newTitle;
        post.content = newContent;
        // post.status = config.config.statuspostenum.PENDING; 
        await post.save();
        return {message: "Update post successfully"};
    }
};

module.exports = postService;