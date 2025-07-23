const db = require('models/index');

const categoryService = {
    getAllCategories: async (limit = 5, page = 1, search='') => {
        const offset = (page - 1) * limit;
        const options = {
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        }

        if (search && search.trim() !== '') {
            options.where = db.sequelize.literal(
                `MATCH(categoryname) AGAINST('${search.trim()}' IN NATURAL LANGUAGE MODE)`
            );
        }

        const { count, rows } = await db.Category.findAndCountAll(options);

        return {
            categories: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    },
    getAllNoPaging: async () => {
        const categories = await db.Category.findAll({
            attributes: ["categoryid", "categoryname"],
            order: [["categoryname", "ASC"]]
        });
        return categories;
    },
    createCategory: async (categoryData) => {
        return await db.Category.create(categoryData);
    },
    updateCategory: async (categoryId, categoryData) => {
        const category = await db.Category.findByPk(categoryId);
        if (!category) {
            throw new Error("Category not found");
        }
        return await category.update(categoryData);
    },
    deleteCategory: async (categoryId) => {
        const category = await db.Category.findByPk(categoryId);
        if (!category) {
            throw new Error("Category not found");
        }
        await category.destroy();
    }
}

module.exports = categoryService;