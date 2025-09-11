-- Script para arreglar la secuencia del campo ID en la tabla user
-- Este script debe ejecutarse en la base de datos de producción

-- 1. Crear la secuencia si no existe
CREATE SEQUENCE IF NOT EXISTS user_id_seq;

-- 2. Establecer el valor actual de la secuencia basado en el máximo ID existente
SELECT setval('user_id_seq', COALESCE((SELECT MAX(id) FROM "user"), 0) + 1, false);

-- 3. Alterar la tabla para usar la secuencia como default
ALTER TABLE "user" ALTER COLUMN id SET DEFAULT nextval('user_id_seq');

-- 4. Establecer la secuencia como propiedad de la columna
ALTER SEQUENCE user_id_seq OWNED BY "user".id;

-- Verificar que todo esté configurado correctamente
SELECT 
    column_name, 
    column_default, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'user' AND column_name = 'id';

-- Mostrar información de la secuencia
SELECT 
    schemaname, 
    sequencename, 
    last_value, 
    start_value, 
    increment_by 
FROM pg_sequences 
WHERE sequencename = 'user_id_seq';
