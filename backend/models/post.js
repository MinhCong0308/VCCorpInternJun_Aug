'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Post.hasMany(models.Comment, {foreignKey: 'postid'});
      Post.belongsTo(models.User, {foreignKey : 'userid'});
      Post.belongsTo(models.Language, {foreignKey: 'languageid'});
      Post.belongsToMany(models.Category, {through: 'category_post'});
      Post.hasMany(models.Post, {
        as: 'translations',
        foreignKey: 'original_postid'
      });
      Post.belongsTo(models.Post, {
        as: 'originalPost',
        foreignKey: 'original_postid'
      });
    }
  }
  Post.init({
    postid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userid: DataTypes.INTEGER,
    languageid: DataTypes.INTEGER,
    original_postid: DataTypes.INTEGER,
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    status: DataTypes.INTEGER,
    like_cnt: DataTypes.INTEGER,
    unlike_cnt: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Post',
    tableName: 'post',
    freezeTableName: true
  });
  return Post;
};