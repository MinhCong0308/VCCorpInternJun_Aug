const userPermissionService = require("modules/user-permission/services/userPermissionService");
const responseUtils = require("utils/responseUtils");

const userPermissonController = {
    // Lấy quyền của user
    getUserPermissions: async (req, res) => {
        const { userid } = req.params;
        try {
            const permissions = await userPermissionService.getUserPermissions(userid);
            if (!permissions) {
            return responseUtils.notFound(res);
            }
            return res.json(permissions);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },

    // Cập nhật quyền của user
    updateUserPermissions: async (req, res) => {
        const { userid } = req.params;
        const { can_write_post, can_like_post, can_write_comment, can_edit_comment } = req.body;
        try {
            const permissions = await userPermissionService.updateUserPermissions(userid, {
            can_write_post,
            can_like_post,
            can_write_comment,
            can_edit_comment,
            });
            return res.json(permissions);
        } catch (error) {
            return responseUtils.error(res, error.message);
        }
    },
};

module.exports = userPermissonController;