const db = require("models/index");

const userPermissionService = {
    getUserPermissions: async (userid) => {
        return await db.UserPermission.findOne({ where: { userid } });
    },

    updateUserPermissions: async (userid, permissions) => {
        let userPermission = await db.UserPermission.findOne({ where: { userid } });
        if (!userPermission) {
            userPermission = await db.UserPermission.create({ userid, ...permissions });
        } else {
            await userPermission.update(permissions);
        }
        return userPermission;
    },
};

module.exports = userPermissionService;
