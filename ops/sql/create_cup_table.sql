-- SQL para crear la tabla `cup` usada por la entidad Cup
-- Ejecutar en la base de datos Postgres de producción si la tabla no existe

CREATE TABLE IF NOT EXISTS cup (
  id SERIAL PRIMARY KEY,
  aseguradora text NOT NULL,
  cups text NOT NULL,
  cuint text,
  servicioFacturado text,
  servicioNormalizado text,
  valor text
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_cup_cups ON cup(cups);
CREATE INDEX IF NOT EXISTS idx_cup_aseguradora ON cup(aseguradora);
