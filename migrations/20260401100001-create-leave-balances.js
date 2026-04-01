'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leave_balances', {
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
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      casual_leaves: {
        type: Sequelize.INTEGER,
        defaultValue: 12
      },
      sick_leaves: {
        type: Sequelize.INTEGER,
        defaultValue: 6
      },
      emergency_leaves: {
        type: Sequelize.INTEGER,
        defaultValue: 3
      },
      personal_leaves: {
        type: Sequelize.INTEGER,
        defaultValue: 2
      },
      casual_used: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      sick_used: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      emergency_used: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      personal_used: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addConstraint('leave_balances', {
      fields: ['trainee_id', 'year'],
      type: 'unique',
      name: 'unique_trainee_year'
    });

    await queryInterface.addIndex('leave_balances', ['trainee_id']);
    await queryInterface.addIndex('leave_balances', ['year']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('leave_balances');
  }
};
