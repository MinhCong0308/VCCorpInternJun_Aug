const db = require("models/index");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const config = require("configs/index");
const userService = {
  getAllUser: async (limit = 5, page = 1, search = "") => {
    const offset = (page - 1) * limit;

    const options = {
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    };

    if (search && search.trim() !== "") {
      const q = search.trim();
      const qLower = q.toLowerCase();
      // Escape LIKE wildcards in user input
      const escapeLike = (s) => s.replace(/[\\%_]/g, "\\$&");
      const likePattern = `%${escapeLike(qLower)}%`;
      const lower = (col) => db.sequelize.fn("LOWER", db.sequelize.col(col));

      // Full-text (contains) search only on username and email
      options.where = {
        [Op.or]: [
          db.sequelize.where(lower("username"), { [Op.like]: likePattern }),
          db.sequelize.where(lower("email"), { [Op.like]: likePattern }),
        ],
      };
    }

    const { count, rows } = await db.User.findAndCountAll(options);

    return {
      user: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  },
  createUser: async (userData) => {
    const hashPassWord = await bcrypt.hash(userData.hashed_password, 10);
    userData.hashed_password = hashPassWord;
    return await db.User.create(userData);
  },
  updateUser: async (userid, userData) => {
    if (userData.hashed_password) {
      const hashPassWord = await bcrypt.hash(userData.hashed_password, 10);
      userData.hashed_password = hashPassWord;
    } else {
      delete userData.hashed_password;
    }
    const user = await db.User.findByPk(userid);
    return user.update(userData);
  },
  updateUserRole: async (userid, roleid) => {
    const user = await db.User.findByPk(userid);
    if (!user) throw new Error("User not found");
    return await user.update({ roleid });
  },
  disableUser: async (userid) => {
    const user = await db.User.findByPk(userid);
    return await user.update({ status: config.config.statusUser.DISABLED });
  },
  enableUser: async (userid) => {
    const user = await db.User.findByPk(userid);
    return await user.update({ status: config.config.statusUser.ACTIVE });
  },
};

module.exports = userService;
