import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface ResetTokenAttributes {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResetTokenCreationAttributes extends Optional<ResetTokenAttributes, "id" | "used"> {}

export class ResetToken extends Model<ResetTokenAttributes, ResetTokenCreationAttributes> implements ResetTokenAttributes {
  declare id!: string;
  declare userId!: string;
  declare token!: string;
  declare expiresAt!: Date;
  declare used!: boolean;

  declare readonly createdAt!: Date;
  declare readonly updatedAt!: Date;
}

ResetToken.init(
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
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "reset_tokens",
    indexes: [
      { fields: ["user_id"] },
      { fields: ["token"] },
    ],
  }
);
