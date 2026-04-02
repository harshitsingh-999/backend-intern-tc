module.exports = (sequelize, DataTypes) => {
  const UpdateRequest = sequelize.define("UpdateRequest", {
    internId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updatedData: {
      type: DataTypes.JSON, // stores all updated fields
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
  });

  return UpdateRequest;
};