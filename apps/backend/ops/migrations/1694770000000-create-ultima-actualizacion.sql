-- Migration SQL: create table ultima_actualizacion
CREATE TABLE IF NOT EXISTS ultima_actualizacion (
  id SERIAL PRIMARY KEY,
  fecha text NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
