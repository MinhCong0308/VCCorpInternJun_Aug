const responseUtils = require("utils/responseUtils");
const dictionaryService = require("modules/dictionary/services/dictionaryService");

const dictionaryController = {
  getAll: async (req, res) => {
    try {
      const {
        limit = 10,
        page = 1,
        search = "",
        status = "",
        locale = "",
      } = req.query;
      const parsedStatus =
        status === "0" || status === "1" ? Number(status) : undefined;
      const data = await dictionaryService.getAll({
        limit: +limit,
        page: +page,
        search,
        status: parsedStatus,
        locale: locale || undefined,
      });
      return responseUtils.ok(res, data);
    } catch (e) {
      return responseUtils.error(res, e.message);
    }
  },
  locales: async (req, res) => {
    try {
      const locales = await dictionaryService.getLocales();
      return responseUtils.ok(res, { locales });
    } catch (e) {
      return responseUtils.error(res, e.message);
    }
  },
  create: async (req, res) => {
    try {
      const created = await dictionaryService.create(req.body);
      return responseUtils.ok(res, created);
    } catch (e) {
      return responseUtils.badRequest(res, e.message);
    }
  },
  delete: async (req, res) => {
    try {
      const { wordid } = req.params;
      await dictionaryService.delete(wordid);
      return responseUtils.ok(res, { message: "Deleted successfully" });
    } catch (e) {
      return responseUtils.badRequest(res, e.message);
    }
  },
  bulkDelete: async (req, res) => {
    try {
      const { ids } = req.body || {};
      const total = await dictionaryService.bulkDelete(ids || []);
      return responseUtils.ok(res, { deleted: total });
    } catch (e) {
      return responseUtils.badRequest(res, e.message);
    }
  },
  enable: async (req, res) => {
    try {
      const { wordid } = req.params;
      const updated = await dictionaryService.setStatus(wordid, 1);
      return responseUtils.ok(res, updated);
    } catch (e) {
      return responseUtils.badRequest(res, e.message);
    }
  },
  disable: async (req, res) => {
    try {
      const { wordid } = req.params;
      const updated = await dictionaryService.setStatus(wordid, 0);
      return responseUtils.ok(res, updated);
    } catch (e) {
      return responseUtils.badRequest(res, e.message);
    }
  },
};

module.exports = dictionaryController;
