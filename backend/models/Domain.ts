import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface DomainAttributes {
  id: string;
  userId: string;
  domainName: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DomainCreationAttributes extends Optional<DomainAttributes, "id" | "status"> {}

export class Domain extends Model<DomainAttributes, DomainCreationAttributes> implements DomainAttributes {
  declare id!: string;
  declare userId!: string;
  declare domainName!: string;
  declare status!: "PENDING" | "ACTIVE" | "SUSPENDED";

  declare readonly createdAt!: Date;
  declare readonly updatedAt!: Date;
}

Domain.init(
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
    domainName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "domain_name",
    },
    status: {
      type: DataTypes.ENUM("PENDING", "ACTIVE", "SUSPENDED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    sequelize,
    tableName: "domains",
    indexes: [
      { unique: true, fields: ["domain_name"] },
      { fields: ["user_id"] },
      { fields: ["status"] },
    ],
  }
);
