#!/bin/bash

echo "🚀 Iniciando migración de base de datos para Railway..."

# Verificar que psql está disponible
if ! command -v psql &> /dev/null; then
    echo "❌ psql no está disponible. Instalando..."
    apt-get update && apt-get install -y postgresql-client
fi

# Verificar variables de entorno
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL no está configurada"
    exit 1
fi

echo "✅ Conectando a la base de datos..."

# Crear las tablas si no existen
psql $DATABASE_URL << 'EOF'
-- Verificar si las tablas existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user') THEN
        -- Crear estructura básica si no existe
        CREATE TABLE IF NOT EXISTS "user" (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            usuario VARCHAR(255) UNIQUE NOT NULL,
            rol VARCHAR(50) NOT NULL,
            aseguradoras TEXT[],
            password VARCHAR(255) NOT NULL,
            estado BOOLEAN DEFAULT true
        );
        
        CREATE TABLE IF NOT EXISTS sede (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            codigo VARCHAR(50),
            activa BOOLEAN DEFAULT true
        );
        
        CREATE TABLE IF NOT EXISTS aseguradora (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            "nombrePergamo" VARCHAR(255),
            activa BOOLEAN DEFAULT true
        );
        
        CREATE TABLE IF NOT EXISTS facturacion_evento (
            id SERIAL PRIMARY KEY,
            "numeroFactura" VARCHAR(100) NOT NULL,
            fecha DATE NOT NULL,
            valor DECIMAL(12,2) NOT NULL,
            sede_id INTEGER REFERENCES sede(id),
            aseguradora VARCHAR(255),
            paciente VARCHAR(255),
            "tipoDocumento" VARCHAR(50),
            documento VARCHAR(50),
            ambito VARCHAR(100),
            "tipoAtencion" VARCHAR(100),
            facturador VARCHAR(100),
            programa VARCHAR(100),
            total DECIMAL(12,2),
            copago DECIMAL(12,2),
            "fechaInicial" DATE,
            "fechaFinal" DATE,
            periodo VARCHAR(20),
            convenio VARCHAR(255),
            portafolio VARCHAR(255),
            nit BIGINT,
            regional VARCHAR(100)
        );
        
        CREATE TABLE IF NOT EXISTS anulacion (
            id SERIAL PRIMARY KEY,
            "numeroAnulacion" VARCHAR(100) NOT NULL,
            fecha DATE NOT NULL,
            "notaCredito" VARCHAR(100),
            "fechaNotaCredito" DATE,
            "tipoDocumento" VARCHAR(20),
            documento VARCHAR(30),
            paciente VARCHAR(100),
            aseguradora VARCHAR(100),
            sede_id INTEGER REFERENCES sede(id),
            facturador VARCHAR(100),
            "totalAnulado" DECIMAL(12,2),
            motivo VARCHAR(100),
            estado VARCHAR(30),
            "facturaRemplazo" VARCHAR(500),
            "fechaRemplazo" VARCHAR(500),
            "valorRemplazo" VARCHAR(500),
            "tipoRegistro" VARCHAR(20),
            observaciones TEXT
        );
        
        -- Insertar usuario administrador por defecto
        INSERT INTO "user" (nombre, usuario, rol, password, estado) 
        VALUES ('Administrador', 'admin', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true)
        ON CONFLICT (usuario) DO NOTHING;
        
        RAISE NOTICE 'Estructura de base de datos creada exitosamente';
    ELSE
        RAISE NOTICE 'Las tablas ya existen, omitiendo creación';
    END IF;
END
$$;
EOF

echo "✅ Migración completada exitosamente"
