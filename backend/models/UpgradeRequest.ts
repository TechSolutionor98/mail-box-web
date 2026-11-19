import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface UpgradeRequestAttributes {
  id: string;
  userId: string;
  packageId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpgradeRequestCreationAttributes extends Optional<UpgradeRequestAttributes, "id" | "status"> {}

export class UpgradeRequest extends Model<UpgradeRequestAttributes, UpgradeRequestCreationAttributes> implements UpgradeRequestAttributes {
  declare id!: string;
  declare userId!: string;
  declare packageId!: string;
  declare status!: "PENDING" | "APPROVED" | "REJECTED";

  declare readonly createdAt!: Date;
  declare readonly updatedAt!: Date;
}

UpgradeRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },
    packageId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "package_id",
    },
    status: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
  },
  {
    sequelize,
    tableName: "upgrade_requests",
    indexes: [
      { fields: ["user_id"] },
      { fields: ["status"] },
    ],
  }
);
