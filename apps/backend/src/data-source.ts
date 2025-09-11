import "reflect-metadata";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || "localhost"),
    port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DATABASE_URL ? undefined : (process.env.DB_USERNAME || "postgres"),
    password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || "Sistemas1234*"),
    database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || "control_usuarios"),
    synchronize: process.env.NODE_ENV === "production" ? false : true,
    logging: process.env.NODE_ENV === "development",
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    entities: [
        "src/entity/**/*.ts"
    ],
    migrations: [
        "src/migration/**/*.ts"
    ],
    subscribers: [],
});
