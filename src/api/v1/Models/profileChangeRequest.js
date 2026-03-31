import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.config.js';

const ProfileChangeRequest = sequelize.define('profile_change_requests', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  change_type: { 
    type: DataTypes.ENUM('personal_info', 'contact_info', 'academic_info'), 
    allowNull: false 
  },
  old_values: { 
    type: DataTypes.JSON, 
    allowNull: true 
  },
  new_values: { 
    type: DataTypes.JSON, 
    allowNull: false 
  },
  status: { 
    type: DataTypes.ENUM('pending', 'approved', 'rejected'), 
    defaultValue: 'pending' 
  },
  admin_note: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  reviewed_by: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  },
  reviewed_at: { 
    type: DataTypes.DATE, 
    allowNull: true 
  }
}, { 
  timestamps: true 
});

export default ProfileChangeRequest;
