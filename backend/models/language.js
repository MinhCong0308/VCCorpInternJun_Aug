'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Language extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Language.hasMany(models.Post, {foreignKey: 'languageid'});
    }
  }
  Language.init({
    languageid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    languagename: DataTypes.STRING,
    locale_code: DataTypes.STRING,
    is_default: DataTypes.BOOLEAN,
    flag_image: DataTypes.STRING,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Language',
    tableName: 'language',
    freezeTableName: true
  });
  return Language;
};