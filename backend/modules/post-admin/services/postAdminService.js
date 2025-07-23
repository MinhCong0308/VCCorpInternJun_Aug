const db = require('models/index');
const config = require('configs/index');
const { Sequelize, Op } = require('sequelize');

const postAdminService = {
    getPostList: async (categoryId, status, userId, languageId, limit = 5, page = 1, search = '') => {
        const offset = (page - 1) * limit;

        const options = {
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        };

        if (search && search.trim() !== '') {
            options.where = {
                [Sequelize.Op.and]: [
                    Sequelize.literal(`MATCH(title, content) AGAINST('${search.trim()}' IN NATURAL LANGUAGE MODE)`)
                ]
            };
        };
        if (status) {
            options.where = options.where ? 
                { ...options.where, status } : 
                { status };
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
            include: [
                {model: db.User, attributes: ['firstname', 'lastname']},
                {model: db.Language, attributes: ['languagename']},
                categoryInclude
            ],
            distinct: true
        });

        return {
            posts: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    },
    getPostDetail: async (postId) => {
        const post = await db.Post.findByPk(postId, {
            include: [
                { model: db.User, attributes: ['firstname', 'lastname', 'avatar'] },
                { model: db.Language, attributes: ['languagename'] },
                { model: db.Category, as: 'Categories', attributes: ['categoryid', 'categoryname'], through: { attributes: [] } }
            ]
        });
        if (!post) {
            throw new Error("Post not found");
        }
        return post;
    },
    approvePost: async (postId) => {
        const post = await db.Post.findByPk(postId);
        if (!post) {
            throw new Error("Post not found");
        }
        if (post.status === config.config.statuspostenum.APPROVED) {
            throw new Error("Post is already approved");
        }
        post.status = config.config.statuspostenum.APPROVED;
        return await post.save();
    },
    rejectPost: async (postId) => {
        const post = await db.Post.findByPk(postId);
        if (!post) {
            throw new Error("Post not found");
        }
        if (post.status === config.config.statuspostenum.REJECTED) {
            throw new Error("Post is already rejected");
        }
        post.status = config.config.statuspostenum.REJECTED;
        return await post.save();
    }
}

module.exports = postAdminService;