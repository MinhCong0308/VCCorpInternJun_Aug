'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('comment', {
      commentid: {
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
      postid: {
        type: Sequelize.INTEGER,
        references: {
          model : "post",
          key: "postid"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      content: {
        type: Sequelize.TEXT
      },
      lft: {
        type: Sequelize.INTEGER
      },
      rgt: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('comment');
  }
};