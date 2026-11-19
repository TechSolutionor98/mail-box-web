import { Sequelize } from "sequelize";

const DB_DIALECT = (process.env.DB_DIALECT || "mysql").toLowerCase() as "mysql" | "postgres" | "sqlite";
const DB_NAME = process.env.DB_NAME || process.env.MYSQL_DATABASE || process.env.POSTGRES_DB || "hostcontrol_db";
const DB_USER = process.env.DB_USER || process.env.MYSQL_USER || process.env.POSTGRES_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.POSTGRES_PASSWORD || "";
const DB_HOST = process.env.DB_HOST || process.env.MYSQL_HOST || process.env.POSTGRES_HOST || "localhost";
const DB_PORT = parseInt(
  process.env.DB_PORT || (DB_DIALECT === "mysql" ? "3306" : DB_DIALECT === "postgres" ? "5432" : "3306"),
  10
);

export const sequelize =
  DB_DIALECT === "sqlite"
    ? new Sequelize({
        dialect: "sqlite",
        storage: process.env.SQLITE_STORAGE || ":memory:",
        logging: false,
        define: {
          timestamps: true,
          underscored: true,
        },
      })
    : new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: DB_PORT,
        dialect: DB_DIALECT,
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        pool: {
          max: 20,
          min: 2,
          acquire: 30000,
          idle: 10000,
        },
        define: {
          timestamps: true,
          underscored: true,
        },
      });

export async function connectDb() {
  try {
    await sequelize.authenticate();
    console.log(`[Database] Connection established successfully using ${DB_DIALECT} dialect.`);
    await sequelize.sync({ alter: true });
    console.log("[Database] Schema synchronized successfully.");
  } catch (error) {
    console.warn(`[Database] Connection warning (${DB_DIALECT}):`, (error as Error).message);
  }
}
