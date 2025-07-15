const responseUtils = require("utils/responseUtils");
const categoryService = require("modules/category/services/categoryService");

const categoryController = {
    getAll: async (req, res) => {
        try {
            const categories = await categoryService.getAllCategories();
            return responseUtils.ok(res, categories);
        } catch (error) {
            return responseUtils.error(res, error.message);
            
        }
    },
    create: async (req, res) => {
        try {
            const categories = req.body;
            const newCategory = await categoryService.createCategory(categories);
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