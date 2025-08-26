const db = require("models/index");
const { Sequelize, Op } = require("sequelize");

const languageService = {
  getAllLanguages: async (status, limit = 5, page = 1, search = "") => {
    const offset = (page - 1) * limit;

    const where = {};
    const trimmed = (search || "").trim();

    // Search in both languagename and locale_code
    if (trimmed) {
      where[Op.or] = [
        Sequelize.literal(
          `MATCH(languagename) AGAINST(${db.sequelize.escape(
            trimmed
          )} IN NATURAL LANGUAGE MODE)`
        ),
        { languagename: { [Op.like]: `%${trimmed}%` } },
        { locale_code: { [Op.like]: `%${trimmed}%` } },
      ];
    }

    // Add status filter (combine with search using AND)
    if (status === 0 || status === 1 || status === "0" || status === "1") {
      where.status = Number(status);
    }

    const { count, rows } = await db.Language.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

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

    const isDefault =
      languageData.is_default !== undefined
        ? Number(languageData.is_default) === 1
        : false;
    // Remove noisy debug logs; keep logic concise

    if (isDefault) {
      languageData.status = 1; // default must be active
    }

    return await db.sequelize.transaction(async (t) => {
      const languageCount = await db.Language.count({ transaction: t });

      let finalIsDefault = isDefault;

      if (languageCount === 0) {
        finalIsDefault = true;
        languageData.status = 1;
      } else if (isDefault) {
        await db.Language.update(
          { is_default: 0 },
          { where: { is_default: 1 }, transaction: t }
        );
      }

      return await db.Language.create(
        {
          ...languageData,
          languagename: name,
          locale_code: locale,
          is_default: finalIsDefault ? 1 : 0,
        },
        { transaction: t }
      );
    });
  },
  updateLanguage: async (languageId, languageData) => {
    const language = await db.Language.findByPk(languageId);
    if (!language) throw new Error("Language not found");

    return await db.sequelize.transaction(async (t) => {
      try {
        // Normalize provided values
        if (languageData.languagename) {
          const name = languageData.languagename.trim();
          const existedName = await db.Language.findOne({
            where: db.sequelize.where(
              db.sequelize.fn("LOWER", db.sequelize.col("languagename")),
              name.toLowerCase()
            ),
            transaction: t,
          });
          if (existedName && existedName.languageid !== language.languageid) {
            throw new Error("Language name already exists");
          }
          languageData.languagename = name;
        }
        if (languageData.locale_code) {
          const locale = languageData.locale_code.trim();
          const existedLocale = await db.Language.findOne({
            where: db.sequelize.where(
              db.sequelize.fn("LOWER", db.sequelize.col("locale_code")),
              locale.toLowerCase()
            ),
            transaction: t,
          });
          if (
            existedLocale &&
            existedLocale.languageid !== language.languageid
          ) {
            throw new Error("Locale code already exists");
          }
          languageData.locale_code = locale;
        }

        if (languageData.status !== undefined) {
          // Coerce to number 0/1
          languageData.status = Number(languageData.status) ? 1 : 0;
        }

        // Check if explicitly setting as default
        const makingDefault =
          languageData.is_default == 1 || languageData.is_default === true;

        // Check if explicitly removing default from current default language
        const removingDefault =
          language.is_default &&
          (languageData.is_default == 0 || languageData.is_default === false);

        // Prevent removing default - must always have one default language
        if (removingDefault) {
          throw new Error(
            "Cannot remove default language. There must always be one default language in the system."
          );
        }

        // Prevent disabling default
        if (language.is_default && languageData.status === 0) {
          throw new Error("Cannot disable default language");
        }

        if (makingDefault) {
          // Ensure active when setting as default
          languageData.status = 1;
          // Remove default status from other languages (not current one)
          await db.Language.update(
            { is_default: 0 },
            {
              where: {
                is_default: 1,
                languageid: { [Op.ne]: languageId },
              },
              transaction: t,
            }
          );
          languageData.is_default = 1;
        } else if (languageData.is_default !== undefined) {
          // Only process is_default if explicitly provided and not making default
          languageData.is_default = Number(languageData.is_default) ? 1 : 0;
        } else {
          // Don't change is_default if not provided
          delete languageData.is_default;
        }

        return await language.update(languageData, { transaction: t });
      } catch (error) {
        throw error; // Re-throw to propagate to controller
      }
    });
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
    if (language.is_default) {
      throw new Error("Cannot disable default language");
    }
    return await language.update({ status: 0 });
  },
};

module.exports = languageService;
