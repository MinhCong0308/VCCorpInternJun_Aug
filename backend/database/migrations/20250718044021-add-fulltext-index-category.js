'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('category', ['categoryname'], {
      type: 'FULLTEXT',
      name: 'idx_category_name'
    });
    await queryInterface.addIndex('language', ['languagename'], {
      type: 'FULLTEXT',
      name: 'idx_language_name'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('category', 'idx_category_name');
    await queryInterface.removeIndex('language', 'idx_language_name');

  }
};
