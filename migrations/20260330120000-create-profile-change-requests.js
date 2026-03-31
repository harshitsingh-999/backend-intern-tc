'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('profile_change_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      change_type: {
        type: Sequelize.ENUM('personal_info', 'contact_info', 'academic_info'),
        allowNull: false
      },
      old_values: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Previous values being changed'
      },
      new_values: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'New values requested'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      admin_note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('profile_change_requests');
  }
};
