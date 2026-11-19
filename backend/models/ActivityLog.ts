import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface ActivityLogAttributes {
  id: string;
  userId?: string | null;
  action: string;
  detailsJson?: string | null;
  ipAddress?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ActivityLogCreationAttributes extends Optional<ActivityLogAttributes, "id" | "userId" | "detailsJson" | "ipAddress"> {}

export class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> implements ActivityLogAttributes {
  declare id!: string;
  declare userId!: string | null;
  declare action!: string;
  declare detailsJson!: string | null;
  declare ipAddress!: string | null;

  declare readonly createdAt!: Date;
  declare readonly updatedAt!: Date;
}

ActivityLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "user_id",
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    detailsJson: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "details_json",
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: "ip_address",
    },
  },
  {
    sequelize,
    tableName: "activity_logs",
    indexes: [
      { fields: ["user_id"] },
      { fields: ["action"] },
      { fields: ["created_at"] },
    ],
  }
);
