const db = require("models/index");
const { Sequelize } = require("sequelize");
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
      options.where = Sequelize.literal(
        `MATCH(firstname, lastname, username, email) AGAINST('${search.trim()}' IN NATURAL LANGUAGE MODE)`
      );
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
  updateUser: async (userId, userData) => {
    const hashPassWord = await bcrypt.hash(userData.hashed_password, 10);
    userData.hashed_password = hashPassWord;
    const user = await db.User.findByPk(userId);
    return user.update(userData);
  },
  disableUser: async (userId) => {
    const user = await db.User.findByPk(userId);
    return await user.update({ status: config.config.statusUser.DISABLED });
  },
  enableUser: async (userId) => {
    const user = await db.User.findByPk(userId);
    return await user.update({ status: config.config.statusUser.ACTIVE });
  },
};

module.exports = userService;
