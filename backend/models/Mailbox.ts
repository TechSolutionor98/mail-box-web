import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface MailboxAttributes {
  id: string;
  domainId: string;
  emailAddress: string;
  passwordHash: string;
  quotaMb: number;
  status: "ACTIVE" | "SUSPENDED";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MailboxCreationAttributes extends Optional<MailboxAttributes, "id" | "quotaMb" | "status"> {}

export class Mailbox extends Model<MailboxAttributes, MailboxCreationAttributes> implements MailboxAttributes {
  declare id!: string;
  declare domainId!: string;
  declare emailAddress!: string;
  declare passwordHash!: string;
  declare quotaMb!: number;
  declare status!: "ACTIVE" | "SUSPENDED";

  declare readonly createdAt!: Date;
  declare readonly updatedAt!: Date;
}

Mailbox.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    domainId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "domain_id",
    },
    emailAddress: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "email_address",
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
    },
    quotaMb: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2048,
      field: "quota_mb",
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "SUSPENDED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    sequelize,
    tableName: "mailboxes",
    indexes: [
      { unique: true, fields: ["email_address"] },
      { fields: ["domain_id"] },
    ],
  }
);
