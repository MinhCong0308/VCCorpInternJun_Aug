const db = require("models/index");
const config = require("configs/index");
const { Op } = require("sequelize");

const postService = {
    createPost: async (originalPost, translations, userid) => {
        try {
            const post = await db.Post.create({
                userid,
                languageid: originalPost.languageid,
                title: originalPost.title,
                content: originalPost.content,
                status: config.config.statuspostenum.PENDING
            });
            await post.save();
            post.original_postid = post.postid;
            await post.save();
            if (originalPost.tags && originalPost.tags.length > 0) {
                await postService.setTagsForPost(post.postid, originalPost.tags);
            }
            // create translations
            if (translations && translations.length > 0) {
                // console.log("Post: ", post.postid)
                // console.log("Translations: ", translations);
                for(const translation of translations) {
                    const translationCreated = await db.Post.create({
                        userid,
                        languageid: translation.languageid,
                        title: translation.title,
                        content: translation.content,
                        status: config.config.statuspostenum.PENDING,
                        original_postid: post.postid
                    });
                    if (translation.tags && translation.tags.length > 0) {
                        await postService.setTagsForPost(translationCreated.postid, translation.tags);
                    }
                }
            }
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
        if (post.status !== config.config.statuspostenum.PENDING) {
            throw new Error("Only pending posts can be updated");
        }
        post.title = title;
        post.content = content;
        post.languageid = languageid;
        await post.save();
        await postService.setTagsForPost(postid, tags);
        return { message: "Post updated successfully", post };
    },
    getAllPosts: async (userid) => {
        // I mean that only get original post of user, that has postid == original_postid.
        try {
            const posts = await db.Post.findAll({
                where: { userid: userid,
                        postid: {
                            [Op.col]: 'original_postid'
                        }
                    },
                include : [{
                    model: db.Category,
                    as: 'Categories',
                    through: { attributes: [] }  
                }]
            });
            console.log("Posts retrieved successfully:", posts);
            if (!posts || posts.length === 0) {
                return { message: "No posts found for this user" };
            }
            const postsWithTags = posts.map(post => ({
                postid: post.postid,
                title: post.title,
                content: post.content,
                languageid: post.languageid,
                tags: post.Categories.map(category => category.categoryname),
                status: config.config.StatusNameById[post.status],
                createdAt: post.createdAt,
            }));
            console.log("Posts retrieved successfully:", postsWithTags);
            return { posts: postsWithTags };
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
        // get translations
        const translations = await db.Post.findAll({
            where: {
                original_postid: postid
            },
            include: [{
                model: db.Category,
                as: 'Categories',
                through: { attributes: [] }
            }]
        });
        // filter translations without original post
        const filteredTranslations = translations.filter(translation => translation.postid !== postid); // get only translations, not original post
        if (!post) {
            throw new Error("Post not found or you are not authorized to view this post");
        }
        return {
            originalPost: {
                postid: post.postid,
                title: post.title,
                content: post.content,
                languageid: post.languageid,
                tags: post.Categories.map(category => category.categoryname),
                status: config.config.StatusNameById[post.status],
                createdAt: post.createdAt,
            },
            translations: filteredTranslations.map(translation => ({
                postid: translation.postid,
                title: translation.title,
                content: translation.content,
                languageid: translation.languageid,
                tags: translation.Categories.map(category => category.categoryname),
                status: config.config.StatusNameById[translation.status],
                createdAt: translation.createdAt,
            }))
        };
    }
};

module.exports = postService;
