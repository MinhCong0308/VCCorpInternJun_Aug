const responseUtils = require("utils/responseUtils");
const languageService = require("modules/language/services/languageService");

const languageController = {
  getAll: async (req, res) => {
    try {
      const { limit = 5, page = 1, search = "" } = req.query;
      const language = await languageService.getAllLanguages(
        +limit,
        +page,
        search
      );
      return responseUtils.ok(res, language);
    } catch (error) {
      console.error("Error fetching languages:", error);
      const message = "An error occurred while fetching languages";
      return responseUtils.error(res, message);
    }
  },
  create: async (req, res) => {
    try {
      const languageData = req.body;

      if (!req.file) {
        return responseUtils.badRequest(res, "Flag image is required.");
      }

      const fileName = req.file.filename;
      const flagImagePath = `/uploads/flags/${fileName}`;

      languageData.flag_image = flagImagePath;

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

      if (req.file) {
        const fileName = req.file.filename;
        const flagImagePath = `/uploads/flags/${fileName}`;

        languageData.flag_image = flagImagePath;
      }

      const updatedLanguage = await languageService.updateLanguage(
        languageId,
        languageData
      );
      return responseUtils.ok(res, updatedLanguage);
    } catch (error) {
      return responseUtils.error(res, error.message);
    }
  },
  delete: async (req, res) => {
    try {
      const { languageId } = req.params;
      await languageService.deleteLanguage(languageId);
      return responseUtils.ok(res, {
        message: "Language deleted successfully",
      });
    } catch (error) {
      return responseUtils.error(res, error.message);
    }
  },
};

module.exports = languageController;
