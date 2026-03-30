// src/api/v1/Models/user.js
import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';
import Role from './role.js';
import Department from './department.js';

const User = sequelize.define('users', {
  password_reset_token: {
  type: DataTypes.STRING,
  allowNull: true,
  defaultValue: null,
},
password_reset_expires: {
  type: DataTypes.DATE,
  allowNull: true,
  defaultValue: null,
},
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
  last_login: DataTypes.DATE,
  profile_picture: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
  
}, {
  timestamps: true
}
);



// User.belongsTo(Role, { foreignKey: 'role_id' });
// User.belongsTo(Department, { foreignKey: 'dept_id' });

export default User;