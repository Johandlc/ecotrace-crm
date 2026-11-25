-- Crea el usuario y las bases de EcoTrace en PostgreSQL (ejecutar como superusuario "postgres").
--   psql -U postgres -f scripts/crear-base.sql
-- Cambia la contraseña y luego expórtala: export DB_PASSWORD='tu-clave'
CREATE ROLE ecotrace LOGIN PASSWORD 'ecotrace';
CREATE DATABASE ecotrace OWNER ecotrace ENCODING 'UTF8';
CREATE DATABASE ecotrace_test OWNER ecotrace ENCODING 'UTF8';  -- sólo para ./mvnw test
