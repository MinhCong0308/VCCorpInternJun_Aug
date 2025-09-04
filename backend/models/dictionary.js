"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Dictionary extends Model {
    static associate(models) {
      // no associations yet
    }
  }
  Dictionary.init(
    {
      wordid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      word: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: true,
      },
      locale: DataTypes.STRING(20),
      status: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: "Dictionary",
      tableName: "dictionary",
      freezeTableName: true,
    }
  );
  return Dictionary;
};
