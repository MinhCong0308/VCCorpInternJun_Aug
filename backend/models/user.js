'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.belongsTo(models.Role, {foreignKey: 'roleid'});
      User.hasMany(models.Post, {foreignKey: 'userid'});
      User.hasMany(models.Comment, {foreignKey: 'userid'});
    }
  }
  User.init({
    userid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    username: DataTypes.STRING,
    hashed_password: DataTypes.STRING,
    status: DataTypes.INTEGER,
    roleid: DataTypes.INTEGER,
    email: DataTypes.STRING,
    last_login_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'user',
    freezeTableName: true
  });
  return User;
};