const responseUtils = require("utils/responseUtils");
const languageService = require("modules/language/services/languageService");

const languageController = {
  getAll: async (req, res) => {
    try {
      let { status, limit = 5, page = 1, search = "" } = req.query;
      // Normalize numeric queries
      if (
        status !== undefined &&
        status !== "" &&
        !(status === "0" || status === "1")
      ) {
        return responseUtils.badRequest(
          res,
          "Invalid status filter. Use 0 or 1."
        );
      }
      const result = await languageService.getAllLanguages(
        status === undefined || status === "" ? undefined : status,
        +limit,
        +page,
        search
      );
      return responseUtils.ok(res, result);
    } catch (error) {
      console.error("Error fetching languages:", error);
      return responseUtils.error(
        res,
        "An error occurred while fetching languages"
      );
    }
  },
  create: async (req, res) => {
    try {
      const languageData = req.body;
      // Flag image optional: attach if uploaded
      if (req.file) {
        const fileName = req.file.filename;
        const flagImagePath = `/uploads/flags/${fileName}`;
        languageData.flag_image = flagImagePath;
      }

      const newLanguage = await languageService.createLanguage(languageData);
      return responseUtils.ok(res, newLanguage);
    } catch (error) {
      const msg = (error && error.message) || "Create language failed";
      // Detect field-specific duplicate errors for frontend mapping
      if (/language name already exists/i.test(msg)) {
        return res.status(400).send({
          success: false,
          status: 400,
          message: msg,
          field: "languagename",
        });
      }
      if (/locale code already exists/i.test(msg)) {
        return res.status(400).send({
          success: false,
          status: 400,
          message: msg,
          field: "locale_code",
        });
      }
      return responseUtils.badRequest(res, msg);
    }
  },
  update: async (req, res) => {
    try {
      const { languageId } = req.params;
      const languageData = req.body;

      // Add file path if a new file was uploaded
      if (req.file) {
        const fileName = req.file.filename;
        const flagImagePath = `/uploads/flags/${fileName}`;
        languageData.flag_image = flagImagePath;
      }

      // At this point, validation has already passed
      const updatedLanguage = await languageService.updateLanguage(
        languageId,
        languageData
      );

      return responseUtils.ok(res, updatedLanguage);
    } catch (error) {
      return responseUtils.badRequest(res, error.message);
    }
  },
  enable: async (req, res) => {
    try {
      const { languageId } = req.params;
      const updated = await languageService.enableLanguage(languageId);
      return responseUtils.ok(res, updated);
    } catch (error) {
      return responseUtils.error(res, error.message);
    }
  },
  disable: async (req, res) => {
    try {
      const { languageId } = req.params;
      const updated = await languageService.disableLanguage(languageId);
      return responseUtils.ok(res, updated);
    } catch (error) {
      return responseUtils.badRequest(res, error.message);
    }
  },
};

module.exports = languageController;
