const db = require('models/index');
const { Sequelize } = require('sequelize');

const postService = {
    getPublishedPosts: async (categoryId, languageId, limit = 10, page = 1, search = '') => {
        const offset = (page - 1) * limit;

        const options = {
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            where: { status: 2 }
        };

        if (search && search.trim() !== '') {
            options.where = {
                ...options.where,
                title: {
                    [Sequelize.Op.like]: `%${search.trim()}%`
                }
            };
        }
        if (languageId) {
            options.where.languageId = languageId;
        }
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
            options,
            include: [
                { model: db.User, attributes: ['firstname', 'lastname', 'avatar'] },
                { model: db.Language, attributes: ['languagename'] },
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
    getPublishedPostDetail: async (postId) => {
        const post = await db.Post.findOne({
            where: { postid: postId, status: 2 },
            include: [
                { model: db.User, attributes: ['firstname', 'lastname', 'avatar'] },
                { model: db.Language, attributes: ['languagename'] },
                { model: db.Category, as: 'Categories', attributes: ['categoryid', 'categoryname'], through: { attributes: [] } }
            ]
        });
        if (!post) {
            throw new Error("Post not found or not published");
        }
        return post;
    }
};

module.exports = postService;