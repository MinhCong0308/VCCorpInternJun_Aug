'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('post', {
      postid: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userid: {
        type: Sequelize.INTEGER,
        references: {
          model: "user",
          key: "userid"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      languageid: {
        type: Sequelize.INTEGER,
        references: {
          model: "language",
          key: "languageid"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      original_postid: {
        type: Sequelize.INTEGER,
        references: {
          model: "post",
          key: "postid"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"

      },
      title: {
        type: Sequelize.STRING
      },
      content: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.INTEGER
      },
      like_cnt: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      unlike_cnt: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('post');
  }
};