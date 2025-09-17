// Exportamos una clase para que TypeORM pueda instanciar la migración en runtime
class CreateCupAndAssignmentTables1694959800000 {
    name = 'CreateCupAndAssignmentTables1694959800000';

    async up(queryRunner: any): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cup" (
                id SERIAL PRIMARY KEY,
                aseguradora text NOT NULL,
                cups text NOT NULL,
                cuint text,
                "servicioFacturado" text,
                "servicioNormalizado" text,
                valor text
            );
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cup_assignment" (
                id SERIAL PRIMARY KEY,
                "cupId" integer,
                "aseguradoraId" integer,
                "sedeId" integer,
                notas text
            );
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_cup_cups ON "cup"(cups);`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_cup_aseguradora ON "cup"(aseguradora);`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_cup_assignment_cup_id ON "cup_assignment"("cupId");`);
    }

    async down(queryRunner: any): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_cup_assignment_cup_id;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_cup_aseguradora;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_cup_cups;`);
        await queryRunner.query(`DROP TABLE IF EXISTS "cup_assignment";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "cup";`);
    }
}

module.exports = CreateCupAndAssignmentTables1694959800000;
