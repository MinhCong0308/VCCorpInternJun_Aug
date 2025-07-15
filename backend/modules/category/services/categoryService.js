const db = require('models/index');

const categoryService = {
    getAllCategories: async () => {
        return await db.Category.findAll();
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