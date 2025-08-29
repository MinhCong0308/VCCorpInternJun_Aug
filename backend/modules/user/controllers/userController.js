const userService = require("modules/user/services/userServices");
const responseUtils = require("utils/responseUtils");

const userController = {
  getAll: async (req, res) => {
    try {
      const { limit = 5, page = 1, search = "", status, role } = req.query;
      let statusNum;
      if (status !== undefined && status !== "") {
        const parsed = Number(status);
        if (!isNaN(parsed) && (parsed === 1 || parsed === 2)) {
          statusNum = parsed;
        }
      }
      let roleNum;
      if (role !== undefined && role !== "") {
        const parsedR = Number(role);
        if (!isNaN(parsedR) && (parsedR === 1 || parsedR === 2))
          roleNum = parsedR;
      }
      const result = await userService.getAllUser(
        +limit,
        +page,
        search,
        statusNum,
        roleNum
      );
      return responseUtils.ok(res, result);
    } catch (error) {
      console.error("Error fetching users:", error);
      return responseUtils.error(res, "An error occurred while fetching users");
    }
  },

  create: async (req, res) => {
    try {
      const userData = req.body;

      if (!req.file) {
        return responseUtils.badRequest(res, "Avatar image is required.");
      }

      const fileName = req.file.filename;
      const avatarImagePath = `/uploads/avatars/${fileName}`;

      userData.avatar = avatarImagePath;

      const newUser = await userService.createUser(userData);
      return responseUtils.ok(res, newUser);
    } catch (error) {
      return responseUtils.error(res, error.message);
    }
  },

  changeRole: async (req, res) => {
    try {
      const { userid } = req.params;
      const { roleid } = req.body;
      const rid = Number(roleid);
      if (rid !== 1 && rid !== 2) {
        return responseUtils.badRequest(res, "Invalid role");
      }
      const updated = await userService.updateUserRole(userid, rid);
      return responseUtils.ok(res, updated);
    } catch (error) {
      return responseUtils.error(res, error.message);
    }
  },

  disable: async (req, res) => {
    try {
      const { userid } = req.params;
      await userService.disableUser(userid);
      return responseUtils.ok(res, { message: "User disabled" });
    } catch (error) {
      return responseUtils.error(res, error.message);
    }
  },

  enable: async (req, res) => {
    try {
      const { userid } = req.params;
      await userService.enableUser(userid);
      return responseUtils.ok(res, { message: "User enabled" });
    } catch (error) {
      return responseUtils.error(res, error.message);
    }
  },
};

module.exports = userController;
