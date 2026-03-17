// src/api/v1/Models/user.js
import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';
import Role from './role.js';
import Department from './department.js';

const User = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role_id: {
    type: DataTypes.INTEGER,
    defaultValue: 4
  },
  dept_id: DataTypes.INTEGER,
  phone: DataTypes.STRING(15),
  address: DataTypes.STRING(255),
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  last_login: DataTypes.DATE
}, {
  timestamps: true
});

// User.belongsTo(Role, { foreignKey: 'role_id' });
// User.belongsTo(Department, { foreignKey: 'dept_id' });

export default User;