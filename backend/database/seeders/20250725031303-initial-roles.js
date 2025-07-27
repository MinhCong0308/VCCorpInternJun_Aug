"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */

    // Chèn dữ liệu vai trò vào bảng 'role'
    await queryInterface.bulkInsert(
      "role",
      [
        {
          roleid: 1,
          rolename: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          roleid: 2,
          rolename: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Bạn có thể thêm các vai trò khác ở đây nếu cần
        // {
        //   roleid: 3,
        //   rolename: 'MODERATOR',
        //   createdAt: new Date(),
        //   updatedAt: new Date()
        // }
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    // Xóa dữ liệu đã chèn khi chạy lệnh `db:seed:undo`
    await queryInterface.bulkDelete(
      "role",
      {
        roleid: [1, 2], // Chỉ định xóa các role có ID là 1 và 2
      },
      {}
    );
  },
};
