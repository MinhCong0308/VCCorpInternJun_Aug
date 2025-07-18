const db = require('models/index');

const languageService = {
    getAllLanguages: async (limit, page) => {
        const offset = (page - 1) * limit;
        const { count, rows } = await db.Language.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
        return {
            languages: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    },
    createLanguage: async (languageData) => {
        return await db.Language.create(languageData);
    },
    updateLanguage: async (languageId, languageData) => {
        const language = await db.Language.findByPk(languageId);
        if( !language) {
            throw new Error("Language not found");
        }
        return await language.update(languageData);
    },
    deleteLanguage: async (languageId) => {
        const language = await db.Language.findByPk(languageId);
        if (!language) {
            throw new Error("Language not found");
        }
        await language.destroy();
    }
}

module.exports = languageService;