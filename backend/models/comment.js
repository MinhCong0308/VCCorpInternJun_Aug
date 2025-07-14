'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Comment.belongsTo(models.User, {foreignKey : 'userid'});
      Comment.belongsTo(models.Post, {foreignKey : 'postid'});
    }
  }
  Comment.init({
    commentid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userid: DataTypes.INTEGER,
    postid: DataTypes.INTEGER,
    content: DataTypes.TEXT,
    lft: DataTypes.INTEGER,
    rgt: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Comment',
    tableName: 'comment',
    freezeTableName: true
  });
  return Comment;
};