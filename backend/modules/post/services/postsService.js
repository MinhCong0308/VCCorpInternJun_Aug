const db = require('models/index');
const { Sequelize, Op } = require('sequelize');
const { extractCoverImage } = require('utils/postUtils');

const postsService = {
    getPublishedPosts: async (categoryId, userId, languageId, original_postId, limit = 5, page = 1, search = '') => {
        const offset = (page - 1) * limit;

        const options = {
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            where: { status: 2 }
        };

        if (search && search.trim() !== '') {
            options.where = {
                [Sequelize.Op.and]: [
                    { status: 2 },
                    Sequelize.literal(`MATCH(title, content) AGAINST('${search.trim()}' IN NATURAL LANGUAGE MODE)`)
                ]
            };
        };
        if (userId) {
            options.where = { ...options.where, userId };
        };
        if (languageId) {
            options.where = { ...options.where, languageId };
        };
        let categoryInclude = {
            model: db.Category,
            as: 'Categories',
            attributes: ['categoryid', 'categoryname'],
            through: { attributes: [] }
        };
        if (categoryId) {
            categoryInclude.where = { categoryid: categoryId };
            categoryInclude.required = true;
        };
        if (original_postId) {
            options.where = { ...options.where, original_postId };
        }

        const { count, rows } = await db.Post.findAndCountAll({
            ...options,
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM Comment
                            WHERE Comment.postid = Post.postid
                        )`),
                        'commentCount'
                    ]
                ]
            },
            include: [
                {model: db.User, attributes: ['firstname', 'lastname', 'avatar']},
                {model: db.Language, attributes: ['languagename']},
                categoryInclude
            ],
            distinct: true
        });

        return {
            posts: rows.map(post => {
                const postJSON = post.toJSON();
                postJSON.coverImage = extractCoverImage(postJSON.content);
                return postJSON;
            }),
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    },
    getPublishedPostsTrending: async (categoryId, userId, languageId, limit = 5, page = 1, search = '') => {
        const offset = (page - 1) * limit;

        const options = {
            limit,
            offset,
            order: [['like_cnt', 'DESC']],
            where: { status: 2 }
        };

        if (search && search.trim() !== '') {
            options.where = {
                [Sequelize.Op.and]: [
                    { status: 2 },
                    Sequelize.literal(`MATCH(title, content) AGAINST('${search.trim()}' IN NATURAL LANGUAGE MODE)`)
                ]
            };
        };
        if (userId) {
            options.where = { ...options.where, userId };
        };
        if (languageId) {
            options.where = { ...options.where, languageId };
        };
        let categoryInclude = {
            model: db.Category,
            as: 'Categories',
            attributes: ['categoryid', 'categoryname'],
            through: { attributes: [] }
        };
        if (categoryId) {
            categoryInclude.where = { categoryid: categoryId };
            categoryInclude.required = true;
        }

        const { count, rows } = await db.Post.findAndCountAll({
            ...options,
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM Comment
                            WHERE Comment.postid = Post.postid
                        )`),
                        'commentCount'
                    ]
                ]
            },
            include: [
                {model: db.User, attributes: ['firstname', 'lastname', 'avatar']},
                {model: db.Language, attributes: ['languagename']},
                categoryInclude
            ],
            distinct: true
        });

        return {
            posts: rows.map(post => {
                const postJSON = post.toJSON();
                postJSON.coverImage = extractCoverImage(postJSON.content);
                return postJSON;
            }),
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    },
    getPublishedPostDetail: async (postId) => {
        const post = await db.Post.findOne({
            where: { 
                postid: postId,
                status: 2 
            },
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM Comment
                            WHERE Comment.postid = Post.postid
                        )`),
                        'commentCount'
                    ]
                ]
            },
            include: [
                { model: db.User, attributes: ['firstname', 'lastname', 'avatar'] },
                { model: db.Language, attributes: ['languagename'] },
                { model: db.Category, as: 'Categories', attributes: ['categoryid', 'categoryname'], through: { attributes: [] } }
            ]
        });
        if (!post) {
            throw new Error("Post not found or not published");
        }
        const postJSON = post.toJSON();
        postJSON.coverImage = extractCoverImage(postJSON.content);
        return postJSON;
    },
    likePost: async (postId, count = 1) => {
        if (!Number.isFinite(count) || count <= 0) count = 1;
        return await db.sequelize.transaction(async (t) => {
            const post = await db.Post.findByPk(postId, { transaction: t });
            if (!post) throw new Error('Post not found');
            const original = post.original_postid ?? post.original_postId ?? post.postid;
            await db.Post.update(
                { like_cnt: Sequelize.literal(`GREATEST(like_cnt + ${count}, 0)`) },
                {
                    where: {
                        [Op.or]: [
                        { original_postid: original }, // khi cột là snake_case
                        { original_postId: original }, // nếu model dùng camelCase
                        { postid: original },           // phòng trường hợp bài gốc không set original_postid
                        ],
                    },
                    transaction: t,
                }
            );
            await post.reload({ transaction: t });
            return post.toJSON();
        });
    },
    unlikePost: async (postId) => {
        const post = await db.Post.findByPk(postId);
        if (!post) {
            throw new Error("Post not found");
        }
        if (post.like_cnt <= 0) {
            throw new Error("This post has no likes");
        }
        post.like_cnt -= 1;
        await post.save();
        return post.toJSON();
    }
};

module.exports = postsService;