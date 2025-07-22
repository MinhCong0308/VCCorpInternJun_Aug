'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Category.belongsToMany(models.Post, {through: 'category_post', foreignKey: 'categoryid', otherKey: 'postid', as: 'Posts'});
    }
  }
  Category.init({
    categoryid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    categoryname: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Category',
    tableName: 'category',
    freezeTableName: true
  });
  return Category;
};