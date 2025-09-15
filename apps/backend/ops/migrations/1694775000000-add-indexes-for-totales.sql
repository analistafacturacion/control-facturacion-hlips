-- Migration: añadir índices para acelerar consultas de totales
-- 1) Activar extensión pg_trgm para índices trigram
-- 2) Índices en columnas usadas por filtros: fecha, sede_id, aseguradora
-- 3) GIN trigram indexes para columnas usadas en búsquedas ILIKE

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice en fecha para filtros por rango
CREATE INDEX IF NOT EXISTS idx_facturacion_evento_fecha ON facturacion_evento (fecha);

-- Índice en sede_id (clave foránea) para filtrado por sede
CREATE INDEX IF NOT EXISTS idx_facturacion_evento_sede_id ON facturacion_evento (sede_id);

-- Índice para búsquedas por aseguradora (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_facturacion_evento_aseguradora_lower ON facturacion_evento (LOWER(aseguradora));

-- Trigram indexes para búsquedas de texto en numeroFactura, paciente y documento
CREATE INDEX IF NOT EXISTS gin_facturacion_evento_numeroFactura_trgm ON facturacion_evento USING gin (numeroFactura gin_trgm_ops);
CREATE INDEX IF NOT EXISTS gin_facturacion_evento_paciente_trgm ON facturacion_evento USING gin (paciente gin_trgm_ops);
CREATE INDEX IF NOT EXISTS gin_facturacion_evento_documento_trgm ON facturacion_evento USING gin (documento gin_trgm_ops);

-- Si tu base de datos ya tiene mucho datos, crear índices concurrentemente puede ser mejor en producción:
-- CREATE INDEX CONCURRENTLY ...
