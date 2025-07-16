const responseUtils = require("utils/responseUtils");
const categoryService = require("modules/category/services/categoryService");

const categoryController = {
    getAll: async (req, res) => {
        try {
            const { limit = 1, page = 5 } = req.query;
            // Assuming getAllCategories accepts limit and page parameters
            const categories = await categoryService.getAllCategories(+limit, +page);
            return responseUtils.ok(res, categories);
        } catch (error) {
            return responseUtils.error(res, error.message);
            
        }
    },
    create: async (req, res) => {
        try {
            const category = req.body;
            const newCategory = await categoryService.createCategory(category);
            return responseUtils.ok(res, newCategory);
        } catch (error) {
            return responseUtils.error(res, error.message);
            
        }
    },
    update: async (req, res) => {
        try {
            const { categoryId } = req.params;
            const categoryData = req.body;
            const updatedCategory = await categoryService.updateCategory(categoryId, categoryData);
            return responseUtils.ok(res, updatedCategory);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
    delete: async (req, res) => {
        try {
            const { categoryId } = req.params;
            await categoryService.deleteCategory(categoryId);
            return responseUtils.ok(res, { message: "Category deleted successfully" });
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    }
}

module.exports = categoryController;