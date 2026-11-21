import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  fullName?: string | null;
  companyName?: string | null;
  phoneNumber?: string | null;
  primaryDomain?: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
  status: "ACTIVE" | "SUSPENDED";
  totpSecret?: string | null;
  totpEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, "id" | "role" | "status" | "totpSecret" | "totpEnabled" | "fullName" | "companyName" | "phoneNumber" | "primaryDomain"> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id!: string;
  declare email!: string;
  declare passwordHash!: string;
  declare fullName!: string | null;
  declare companyName!: string | null;
  declare phoneNumber!: string | null;
  declare primaryDomain!: string | null;
  declare role!: "SUPER_ADMIN" | "ADMIN" | "USER";
  declare status!: "ACTIVE" | "SUSPENDED";
  declare totpSecret!: string | null;
  declare totpEnabled!: boolean;

  declare readonly createdAt!: Date;
  declare readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
    },
    fullName: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: "full_name",
    },
    companyName: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: "company_name",
    },
    phoneNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "phone_number",
    },
    primaryDomain: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "primary_domain",
    },
    role: {
      type: DataTypes.ENUM("SUPER_ADMIN", "ADMIN", "USER"),
      allowNull: false,
      defaultValue: "USER",
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "SUSPENDED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
    totpSecret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "totp_secret",
    },
    totpEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "totp_enabled",
    },
  },
  {
    sequelize,
    tableName: "users",
    indexes: [
      { unique: true, fields: ["email"] },
      { fields: ["role"] },
      { fields: ["status"] },
    ],
  }
);
