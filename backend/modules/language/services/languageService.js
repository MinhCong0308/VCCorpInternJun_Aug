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
    const name = (languageData.languagename || "").trim();
    const locale = (languageData.locale_code || "").trim();
    if (!name) throw new Error("Language name is required");
    if (!locale) throw new Error("Locale code is required");
    const existedName = await db.Language.findOne({
      where: db.sequelize.where(
        db.sequelize.fn("LOWER", db.sequelize.col("languagename")),
        name.toLowerCase()
      ),
    });
    if (existedName) throw new Error("Language name already exists");
    const existedLocale = await db.Language.findOne({
      where: db.sequelize.where(
        db.sequelize.fn("LOWER", db.sequelize.col("locale_code")),
        locale.toLowerCase()
      ),
    });
    if (existedLocale) throw new Error("Locale code already exists");
    return await db.Language.create({
      ...languageData,
      languagename: name,
      locale_code: locale,
    });
  },
  updateLanguage: async (languageId, languageData) => {
    const language = await db.Language.findByPk(languageId);
    try {
      if (!language) throw new Error("Language not found");
      if (languageData.languagename) {
        const name = languageData.languagename.trim();
        const existedName = await db.Language.findOne({
          where: {
            languagename: name,
          },
        });
        if (existedName && existedName.languageid !== language.languageid) {
          throw new Error("Language name already exists");
        }
        languageData.languagename = name;
      }
      if (languageData.locale_code) {
        const locale = languageData.locale_code.trim();
        const existedLocale = await db.Language.findOne({
          where: {
            locale_code: locale,
          },
        });
        if (existedLocale && existedLocale.languageid !== language.languageid) {
          throw new Error("Locale code already exists");
        }
        languageData.locale_code = locale;
      }
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
