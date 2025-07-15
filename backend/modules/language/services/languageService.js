const db = require('models/index');
const { getAll, create, update } = require('../controllers/languageController');

const languageService = {
    getAllLanguages: async () => {
        return await db.Language.findAll();
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