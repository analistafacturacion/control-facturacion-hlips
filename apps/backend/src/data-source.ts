import "reflect-metadata";
import { createConnection } from "typeorm";
import { User } from "./entity/User";
import { FacturacionEvento } from "./entity/FacturacionEvento";
import { Anulacion } from "./entity/Anulacion";
import { Aseguradora } from "./entity/Aseguradora";
import { Sede } from "./entity/Sede";
import { ReporteRips } from "./entity/ReporteRips";
import { RipsFactura } from "./entity/RipsFactura";
import { UltimaActualizacion } from "./entity/UltimaActualizacion";
import { Cup } from './entity/Cup';

let connection: any;

export const AppDataSource = {
    initialize: async (): Promise<any> => {
        if (connection) {
            return connection;
        }
        
        connection = await createConnection({
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
                User,
                FacturacionEvento,
                Anulacion,
                Aseguradora,
                Sede,
                Cup,
                ReporteRips,
                RipsFactura
                ,UltimaActualizacion
            ],
            migrations: process.env.NODE_ENV === "production"
                ? ["dist/migration/**/*.js"] 
                : ["src/migration/**/*.ts"],
            subscribers: [],
        });
        
        return connection;
    },
    
    get isInitialized(): boolean {
        return connection && connection.isConnected;
    },
    
    destroy: async (): Promise<void> => {
        if (connection && connection.isConnected) {
            await connection.close();
        }
    }
};
