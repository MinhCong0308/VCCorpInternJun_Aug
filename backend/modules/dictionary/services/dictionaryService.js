const db = require("models/index");
const globalFilter = require("utils/globalFilter");

const dictionaryService = {
  // Supports filters: search (substring on word), status (0|1), locale (exact match)
  getAll: async ({ limit = 10, page = 1, search = "", status, locale }) => {
    const offset = (page - 1) * limit;
    const where = {};
    if (search && search.trim()) {
      where.word = { [db.Sequelize.Op.like]: `%${search.trim()}%` };
    }
    if (status === 0 || status === 1) {
      where.status = status;
    }
    if (locale && locale.trim()) {
      where.locale = locale.trim();
    }
    const { count, rows } = await db.Dictionary.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    return {
      words: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit) || 1,
    };
  },
  create: async (data) => {
    const word = (data.word || "").trim().toLowerCase();
    if (!word) throw new Error("Word is required");
    const existed = await db.Dictionary.findOne({
      where: db.sequelize.where(
        db.sequelize.fn("LOWER", db.sequelize.col("word")),
        word
      ),
    });
    if (existed) throw new Error("Word already exists");
    const created = await db.Dictionary.create({
      word,
      locale: data.locale || null,
      status: data.status !== undefined ? data.status : 1,
    });
    // update global filter
    globalFilter.addBadWords([word]);
    return created;
  },
  setStatus: async (wordid, status) => {
    const record = await db.Dictionary.findByPk(wordid);
    if (!record) throw new Error("Word not found");
    if (record.status === status) return record;
    record.status = status;
    await record.save();
    if (status) globalFilter.addBadWords([record.word]);
    else globalFilter.removeWords([record.word]);
    return record;
  },
  delete: async (wordid) => {
    const record = await db.Dictionary.findByPk(wordid);
    if (!record) throw new Error("Word not found");
    await record.destroy();
    globalFilter.removeWords([record.word]);
  },
  bulkDelete: async (ids = []) => {
    if (!Array.isArray(ids) || !ids.length) return 0;
    const records = await db.Dictionary.findAll({ where: { wordid: ids } });
    const words = records.map((r) => r.word);
    const deleted = await db.Dictionary.destroy({ where: { wordid: ids } });
    if (words.length) globalFilter.removeWords(words);
    return deleted;
  },
  reloadAllToGlobalFilter: async () => {
    const all = await db.Dictionary.findAll({ where: { status: 1 } });
    const words = all.map((r) => r.word);
    globalFilter.loadDatabaseWords(words);
  },
  getLocales: async () => {
    const rows = await db.Dictionary.findAll({
      attributes: [
        [db.Sequelize.fn("LOWER", db.Sequelize.col("locale")), "locale"],
      ],
      where: { locale: { [db.Sequelize.Op.ne]: null } },
      group: ["locale"],
      raw: true,
    });
    return rows.map((r) => r.locale).filter(Boolean);
  },
};

module.exports = dictionaryService;
