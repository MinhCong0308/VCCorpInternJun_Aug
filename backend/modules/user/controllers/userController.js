const responseUtils = require("utils/responseUtils");
const userService = require("modules/user/services/userServices");

const userController = {
  getAll: async (req, res) => {
    try {
      const { limit = 5, page = 1, search = "" } = req.query;
      const user = await userService.getAllUser(+limit, +page, search);
      return responseUtils.ok(res, user);
    } catch (error) {
      console.error("Error fetching users:", error);
      const message = "An error occurred while fetching user";
      return responseUtils.error(res, message);
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
  update: async (req, res) => {
    try {
      const { userId } = req.params;
      const userData = req.body;

      if (req.file) {
        const fileName = req.file.filename;
        const avatarImagePath = `/uploads/avatars/${fileName}`;

        userData.avatar = avatarImagePath;
      }

      const updateUser = await userService.updateUser(userId, userData);
      return responseUtils.ok(res, updateUser);
    } catch (error) {
      return responseUtils.error(res, error.message);
    }
  },
  disable: async (req, res) => {
    try {
      const { userId } = req.params;
      await userService.disableUser(userId);
      return responseUtils.ok(res, {
        message: "User disable",
      });
    } catch (error) {
      return responseUtils.error(res, error.message);
    }
  },
  enabel: async (req, res) => {
    try {
      const { userId } = req.params;
      await userService.enableUser(userId);
      return responseUtils.ok(res, {
        message: "User enable",
      });
    } catch (error) {
      return responseUtils.error(res, error.message);
    }
  },
};

module.exports = userController;
