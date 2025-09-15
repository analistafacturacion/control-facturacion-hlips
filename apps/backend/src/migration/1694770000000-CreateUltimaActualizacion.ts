import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateUltimaActualizacion1694770000000 implements MigrationInterface {
    name = 'CreateUltimaActualizacion1694770000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "ultima_actualizacion" (
            "id" SERIAL PRIMARY KEY,
            "fecha" text NOT NULL,
            "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "ultima_actualizacion"`);
    }

}
