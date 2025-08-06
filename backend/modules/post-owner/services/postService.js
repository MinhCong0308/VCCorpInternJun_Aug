const db = require("models/index");
const config = require("configs/index");
const { Op } = require("sequelize");

const postService = {
    createPost: async (title, content, userid, languageid, tags) => {
        try {
            console.log("Here is start of createPost");
            const post = await db.Post.create({
                userid,
                languageid,
                title,
                content,
                status: config.config.statuspostenum.PENDING
            });
            post.original_postid = post.postid;
            if (tags && tags.length > 0) {
                await postService.setTagsForPost(post.postid, tags);
            }
            console.log("Post created successfully:", post);    
            await post.save();
            return { message: "Post created successfully", post };
        } catch (error) {
            console.log("Error creating post:", error.message);
            throw new Error("Error creating post");
        }
    },
    deletePost: async (postid, userid) => {
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
    updatePost: async (postid, title, content, userid, languageid, tags) => {
        const post = await db.Post.findByPk(postid);
        if (!post) {
            throw new Error("Post not found");
        }
        if (post.userid !== userid) {
            throw new Error("You are not authorized to update this post");
        }
        post.title = title;
        post.content = content;
        post.languageid = languageid;
        await post.save();
        await postService.setTagsForPost(postid, tags);
        return { message: "Post updated successfully", post };
    },
    getAllPosts: async (userid) => {
        try {
            const posts = await db.Post.findAll({
                where: { userid: userid }
            });
            if (!posts || posts.length === 0) {
                return { message: "No posts found for this user" };
            }
            console.log("Posts retrieved successfully:", posts);
            return {posts};
        } catch (error) {
            console.error("Error retrieving posts:", error);
            throw new Error("Error retrieving posts");
        }
    },
    setTagsForPost: async (postid, tags) => {
        const post = await db.Post.findByPk(postid);
        if (!post) {
            throw new Error("Post not found");
        }
        const categories = await db.Category.findAll({
            where: { categoryname: tags }
        });
        if (categories.length !== tags.length) {
            throw new Error("Some categories not found");
        }
        try {
            await post.setCategories(categories);
            console.log("Tags set successfully for post:", postid);
        } catch (error) {
            console.error("Error setting tags for post:", error);
            throw new Error("Error setting tags for post");
        }
    },
    getSpecificPost: async (postid, userid) => {
        const post = await db.Post.findOne({
            where: {
                postid: postid,
                userid: userid
            },
            include: [{
                model: db.Category,
                as: 'Categories',
                through: { attributes: [] } 
            }]
        });
        if (!post) {
            throw new Error("Post not found or you are not authorized to view this post");
        }
        // console.log("Specific post retrieved successfully:", post);
        return {
            title: post.title,
            content: post.content,
            languageid: post.languageid,
            tags: post.Categories.map(category => category.categoryname)
        };
    }
};

module.exports = postService;
