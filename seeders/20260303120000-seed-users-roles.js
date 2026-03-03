'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First create roles
    await queryInterface.bulkInsert('roles', [
      {
        role_name: 'Admin',
        description: 'Administrator role',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        role_name: 'Manager',
        description: 'Manager role',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        role_name: 'Trainee',
        description: 'Trainee role',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        role_name: 'Intern',
        description: 'Intern role',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Then create test users
    await queryInterface.bulkInsert('users', [
      {
        name: 'Admin User',
        email: 'admin@teamcomputers.com',
        password: 'admin123',
        role_id: 1,
        is_active: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Manager User',
        email: 'manager@teamcomputers.com',
        password: 'manager123',
        role_id: 2,
        is_active: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};

