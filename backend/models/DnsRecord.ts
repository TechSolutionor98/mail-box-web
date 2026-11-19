import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "SPF" | "DKIM" | "DMARC";

export interface DnsRecordAttributes {
  id: string;
  domainId: string;
  type: DnsRecordType;
  name: string;
  value: string;
  ttl: number;
  priority: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DnsRecordCreationAttributes extends Optional<DnsRecordAttributes, "id" | "ttl" | "priority"> {}

export class DnsRecord extends Model<DnsRecordAttributes, DnsRecordCreationAttributes> implements DnsRecordAttributes {
  declare id!: string;
  declare domainId!: string;
  declare type!: DnsRecordType;
  declare name!: string;
  declare value!: string;
  declare ttl!: number;
  declare priority!: number;

  declare readonly createdAt!: Date;
  declare readonly updatedAt!: Date;
}

DnsRecord.init(
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
    type: {
      type: DataTypes.ENUM("A", "AAAA", "CNAME", "MX", "TXT", "SPF", "DKIM", "DMARC"),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ttl: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 14400,
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
  },
  {
    sequelize,
    tableName: "dns_records",
    indexes: [
      { fields: ["domain_id"] },
      { fields: ["domain_id", "type"] },
    ],
  }
);
