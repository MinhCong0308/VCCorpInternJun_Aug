const db = require("models/index");
const config = require("configs/index");
const { Op } = require("sequelize");
const axios = require("axios");
const language = require("models/language");
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
    updatePost: async (originalPost, translations, userid, postid) => {
        try {
            const post = await db.Post.findByPk(postid);
            console.log("Updating post with ID:", postid, "for user ID:", userid);
            if (!post) {
                throw new Error("Post not found");
            }
            if (post.userid !== userid) {
                throw new Error("You are not authorized to update this post");
            }
            if (post.status !== config.config.statuspostenum.PENDING) {
                throw new Error("Only pending posts can be updated");
            }
            post.title = originalPost.title;
            post.content = originalPost.content;
            post.languageid = originalPost.languageid;
            await post.save();
            await postService.setTagsForPost(post.postid, originalPost.tags);
            // Update translations
            if (translations && translations.length > 0) {
                for (const translation of translations) {
                    const trans = await db.Post.findOne({ where: { original_postid: postid, languageid: translation.languageid } });
                    if (trans) {
                        trans.title = translation.title;
                        trans.content = translation.content;
                        trans.languageid = translation.languageid;
                        await trans.save();
                        await postService.setTagsForPost(trans.postid, translation.tags);
                    }
                    else {
                        // create new trans
                        const newTrans = await db.Post.create({
                            userid,
                            languageid: translation.languageid,
                            title: translation.title,
                            content: translation.content,
                            status: config.config.statuspostenum.PENDING,
                            original_postid: postid
                        });
                        await postService.setTagsForPost(newTrans.postid, translation.tags);
                    }
                }
            }
            return { message: "Post updated successfully", post };
        } catch (error) {
            console.error("Error updating post:", error);
            throw new Error("Error updating post");
        }
    },
    getAllPosts: async (userid) => {
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
        if (!post) {
            throw new Error("Post not found or you are not authorized to view this post");
        }
        return {
            post: {
                postid: post.postid,
                title: post.title,
                content: post.content,
                languageid: post.languageid,
                tags: post.Categories.map(category => category.categoryname),
                status: config.config.StatusNameById[post.status],
                createdAt: post.createdAt
            }
        };
    },
    getTranslationForPost: async (postid) => {
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
        const filteredTranslations = translations.filter(translation => translation.postid !== translation.original_postid); // get only translations, not original post
        console.log("Filtered Translations:", filteredTranslations);
        return {
            translations: filteredTranslations.map(translation => ({
                postid: translation.postid,
                title: translation.title,
                content: translation.content,
                languageid: translation.languageid,
                tags: translation.Categories.map(category => category.categoryname),
                status: config.config.StatusNameById[translation.status],
                createdAt: translation.createdAt
            }))
        };
    },
    translate: async (text, sourceLanguage, targetLanguage) => {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        const apiKey = process.env.GOOGLE_API_KEY;
        const prompt = sourceLanguage === 'auto' 
            ? `Translate the following text to ${targetLanguage}: ${text}. Just the translation, no explanations.` 
            : `Translate the following text from ${sourceLanguage} to ${targetLanguage}: ${text}. Just the translation, no explanations.`;
        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ]
        };
        const headers = {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
        };
        try {
            const response = await axios.post(url, payload, { headers });
            const translatedText = response.data.candidates[0].content.parts[0].text;
            return translatedText.trim();
        } catch(error) {
            console.error("Error translating text:", error);
            throw new Error("Error translating text");
        }
    }
};

module.exports = postService;
