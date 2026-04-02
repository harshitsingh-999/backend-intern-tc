'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leaves', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      trainee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'trainees',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      leave_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      leave_type: {
        type: Sequelize.ENUM('casual', 'sick', 'emergency', 'personal', 'unpaid'),
        defaultValue: 'casual'
      },
      leave_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        defaultValue: 'pending'
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.TEXT,
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
    
    await queryInterface.addIndex('leaves', ['trainee_id']);
    await queryInterface.addIndex('leaves', ['leave_date']);
    await queryInterface.addIndex('leaves', ['status']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('leaves');
  }
};
