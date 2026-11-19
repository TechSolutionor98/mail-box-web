import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface PackageAttributes {
  id: string;
  name: string;
  price: number;
  maxDomains: number;
  maxMailboxesPerDomain: number;
  storageQuotaMb: number;
  durationDays: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PackageCreationAttributes extends Optional<PackageAttributes, "id" | "durationDays"> {}

export class Package extends Model<PackageAttributes, PackageCreationAttributes> implements PackageAttributes {
  declare id!: string;
  declare name!: string;
  declare price!: number;
  declare maxDomains!: number;
  declare maxMailboxesPerDomain!: number;
  declare storageQuotaMb!: number;
  declare durationDays!: number;

  declare readonly createdAt!: Date;
  declare readonly updatedAt!: Date;
}

Package.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    maxDomains: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "max_domains",
    },
    maxMailboxesPerDomain: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "max_mailboxes_per_domain",
    },
    storageQuotaMb: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "storage_quota_mb",
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      field: "duration_days",
    },
  },
  {
    sequelize,
    tableName: "packages",
    indexes: [{ unique: true, fields: ["name"] }],
  }
);
