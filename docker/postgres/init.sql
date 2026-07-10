-- Init script para PostgreSQL
-- Crea las bases de datos auxiliares necesarias para desarrollo
-- El schema-per-tenant se crea dinamicamente desde la API al registrar un nuevo comercio.

CREATE DATABASE pos_saas_shadow;
