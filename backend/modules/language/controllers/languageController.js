const responseUtils = require("utils/responseUtils");
const languageService = require("modules/language/services/languageService");

const languageController = {
    getAll: async (req, res) => {
        try {
            const languages = await languageService.getAllLanguages();
            return responseUtils.ok(res, languages);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
    create: async (req, res) => {
        try {
            const languageData = req.body;
            const newLanguage = await languageService.createLanguage(languageData);
            return responseUtils.ok(res, newLanguage);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
    update: async (req, res) => {
        try {
            const { languageId } = req.params;
            const languageData = req.body;
            const updatedLanguage = await languageService.updateLanguage(languageId, languageData);
            return responseUtils.ok(res, updatedLanguage);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
    delete: async (req, res) => {
        try {
            const { languageId } = req.params;
            await languageService.deleteLanguage(languageId);
            return responseUtils.ok(res, { message: "Language deleted successfully" });
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    }
}

module.exports = languageController;