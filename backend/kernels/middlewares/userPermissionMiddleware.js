const { UserPermission } = require('../../models');
const responseUtils = require('utils/responseUtils');

// type: 'can_write_post' | 'can_like_post' | 'can_write_comment' | 'can_edit_comment'
const checkUserPermission = (type) => {
  return async (req, res, next) => {
    const userid = req.user?.userid || req.body.userid || req.params.userid;
    if (!userid) {
      return responseUtils.forbidden(res, 'User ID is required');
    }
    const userPermission = await UserPermission.findOne({ where: { userid } });
    if (!userPermission || userPermission[type] === false) {
      return responseUtils.forbidden(res, `You do not have permission to perform this action: ${type}`);
    }
    next();
  };
};

module.exports = { checkUserPermission };