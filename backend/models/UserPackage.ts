import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface UserPackageAttributes {
  id: string;
  userId: string;
  packageId: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserPackageCreationAttributes extends Optional<UserPackageAttributes, "id" | "status"> {}

export class UserPackage extends Model<UserPackageAttributes, UserPackageCreationAttributes> implements UserPackageAttributes {
  declare id!: string;
  declare userId!: string;
  declare packageId!: string;
  declare status!: "ACTIVE" | "EXPIRED" | "CANCELLED";
  declare expiresAt!: Date;

  declare readonly createdAt!: Date;
  declare readonly updatedAt!: Date;
}

UserPackage.init(
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
      type: DataTypes.ENUM("ACTIVE", "EXPIRED", "CANCELLED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
  },
  {
    sequelize,
    tableName: "user_packages",
    indexes: [
      { fields: ["user_id"] },
      { fields: ["package_id"] },
      { fields: ["status"] },
      { fields: ["expires_at"] },
    ],
  }
);
