const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserPermission extends Model {
    static associate(models) {
      UserPermission.belongsTo(models.User, {
        foreignKey: 'userid',
        as: 'user',
        onDelete: 'CASCADE'
      });
    }
  }
  UserPermission.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    can_write_post: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    can_like_post: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    can_write_comment: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    can_edit_comment: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'UserPermission',
    tableName: 'user_permissions',
    timestamps: true
  });
  return UserPermission;
};
