const db = require("models/index");
const { Sequelize } = require("sequelize");

const languageService = {
  getAllLanguages: async (status, limit = 5, page = 1, search = "") => {
    const offset = (page - 1) * limit;

    const options = {
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    };

    if (search && search.trim() !== "") {
      options.where = Sequelize.literal(
        `MATCH(languagename) AGAINST('${search.trim()}' IN NATURAL LANGUAGE MODE)`
      );
    }
    if (status) {
      options.where = { ...options.where, status };
    }

    const { count, rows } = await db.Language.findAndCountAll(options);

    return {
      languages: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  },

  createLanguage: async (languageData) => {
    return await db.Language.create(languageData);
  },
  updateLanguage: async (languageId, languageData) => {
    const language = await db.Language.findByPk(languageId);
    try {
      return await language.update(languageData);
    } catch (error) {
      throw new Error("Failed to update language: " + error.message);
    }
  },
  enableLanguage: async (languageId) => {
    const language = await db.Language.findByPk(languageId);
    if (!language) {
      throw new Error("Language not found");
    }
    return await language.update({ status: 1 });
  },
  disableLanguage: async (languageId) => {
    const language = await db.Language.findByPk(languageId);
    if (!language) {
      throw new Error("Language not found");
    }
    return await language.update({ status: 0 });
  },
};

module.exports = languageService;
