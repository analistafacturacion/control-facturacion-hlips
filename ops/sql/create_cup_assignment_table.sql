-- SQL para crear la tabla cup_assignment
-- Ejecutar en la base de datos Postgres de producción si las migraciones no se aplican automáticamente

CREATE TABLE IF NOT EXISTS cup_assignment (
  id SERIAL PRIMARY KEY,
  cup_id integer,
  aseguradora_id integer,
  sede_id integer,
  notas text
);

-- Opcional: agregar índices a llaves foráneas
CREATE INDEX IF NOT EXISTS idx_cup_assignment_cup_id ON cup_assignment(cup_id);
CREATE INDEX IF NOT EXISTS idx_cup_assignment_aseguradora_id ON cup_assignment(aseguradora_id);
CREATE INDEX IF NOT EXISTS idx_cup_assignment_sede_id ON cup_assignment(sede_id);
