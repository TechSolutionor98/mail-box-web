import { Sequelize } from "sequelize";

const DB_DIALECT = (process.env.DB_DIALECT || "postgres") as any;
const DB_NAME = process.env.POSTGRES_DB || "hostcontrol_db";
const DB_USER = process.env.POSTGRES_USER || "postgres";
const DB_PASSWORD = process.env.POSTGRES_PASSWORD || "postgres";
const DB_HOST = process.env.POSTGRES_HOST || "localhost";
const DB_PORT = parseInt(process.env.POSTGRES_PORT || "5432", 10);

export const sequelize = DB_DIALECT === "sqlite"
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
      dialect: "postgres",
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
    if (DB_DIALECT === "sqlite" || process.env.NODE_ENV === "test") {
      await sequelize.sync({ alter: true });
      console.log("[Database] Schema synchronized successfully.");
    }
  } catch (error) {
    console.warn(`[Database] Connection warning (${DB_DIALECT}):`, (error as Error).message);
  }
}

