#!/bin/bash

# Script para crear los TEMAS de colores de CiviGest
# Incluye 5 temas: Blanco/Azul Profesional (default), Tinto, Azul, Verde, Naranja

set -e

echo "🎨 Creando TEMAS de colores para CiviGest..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    exit 1
fi

# Extraer datos de conexión de DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:\/]*\).*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "${BLUE}📡 Conexión PostgreSQL:${NC}"
echo "   Database: $DB_NAME"
echo ""

# Test conexión
if ! PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se puede conectar a PostgreSQL${NC}"
    exit 1
fi

echo -e "${BLUE}💾 Creando temas...${NC}"
echo ""

# Limpiar todos los temas existentes
echo -e "${YELLOW}🗑️  Limpiando temas anteriores...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "TRUNCATE TABLE themes RESTART IDENTITY CASCADE;" > /dev/null 2>&1

# Tema 1: Blanco y Azul Profesional (DEFAULT)
echo -e "${CYAN}  ➜ Blanco y Azul Profesional (default)${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
INSERT INTO themes (name, description, \"primaryColor\", \"secondaryColor\", \"accentColor\", \"backgroundColor\", \"surfaceColor\", \"textPrimaryColor\", \"textSecondaryColor\", \"successColor\", \"warningColor\", \"errorColor\", \"infoColor\", \"darkMode\", \"isDefault\", \"createdAt\", \"updatedAt\")
VALUES ('Blanco y Azul Profesional', 'Tema por defecto limpio y profesional con tonos blancos y azul corporativo', '#2563EB', '#1E40AF', '#60A5FA', '#FFFFFF', '#F8FAFC', '#1E293B', '#64748B', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', false, true, NOW(), NOW());
" > /dev/null 2>&1

# Tema 2: Tinto Elegante
echo -e "${MAGENTA}  ➜ Tinto Elegante${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
INSERT INTO themes (name, description, \"primaryColor\", \"secondaryColor\", \"accentColor\", \"backgroundColor\", \"surfaceColor\", \"textPrimaryColor\", \"textSecondaryColor\", \"successColor\", \"warningColor\", \"errorColor\", \"infoColor\", \"darkMode\", \"isDefault\", \"createdAt\", \"updatedAt\")
VALUES ('Tinto Elegante', 'Tema con tonos vino tinto, elegante y profesional', '#722F37', '#4A1C23', '#D4A5A5', '#FAFAFA', '#FFFFFF', '#1A1A1A', '#6B7280', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', false, false, NOW(), NOW());
" > /dev/null 2>&1

# Tema 3: Azul Corporativo
echo -e "${BLUE}  ➜ Azul Corporativo${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
INSERT INTO themes (name, description, \"primaryColor\", \"secondaryColor\", \"accentColor\", \"backgroundColor\", \"surfaceColor\", \"textPrimaryColor\", \"textSecondaryColor\", \"successColor\", \"warningColor\", \"errorColor\", \"infoColor\", \"darkMode\", \"isDefault\", \"createdAt\", \"updatedAt\")
VALUES ('Azul Corporativo', 'Tema azul profesional ideal para entornos corporativos', '#1E40AF', '#1E3A5F', '#93C5FD', '#F8FAFC', '#FFFFFF', '#0F172A', '#64748B', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9', false, false, NOW(), NOW());
" > /dev/null 2>&1

# Tema 4: Verde Natural
echo -e "${GREEN}  ➜ Verde Natural${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
INSERT INTO themes (name, description, \"primaryColor\", \"secondaryColor\", \"accentColor\", \"backgroundColor\", \"surfaceColor\", \"textPrimaryColor\", \"textSecondaryColor\", \"successColor\", \"warningColor\", \"errorColor\", \"infoColor\", \"darkMode\", \"isDefault\", \"createdAt\", \"updatedAt\")
VALUES ('Verde Natural', 'Tema verde fresco, transmite confianza y naturalidad', '#166534', '#14532D', '#86EFAC', '#F8FDF9', '#FFFFFF', '#1A1A1A', '#4B5563', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', false, false, NOW(), NOW());
" > /dev/null 2>&1

# Tema 5: Naranja Energético
echo -e "${YELLOW}  ➜ Naranja Energético${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
INSERT INTO themes (name, description, \"primaryColor\", \"secondaryColor\", \"accentColor\", \"backgroundColor\", \"surfaceColor\", \"textPrimaryColor\", \"textSecondaryColor\", \"successColor\", \"warningColor\", \"errorColor\", \"infoColor\", \"darkMode\", \"isDefault\", \"createdAt\", \"updatedAt\")
VALUES ('Naranja Energético', 'Tema naranja cálido, transmite energía y dinamismo', '#C2410C', '#9A3412', '#FDBA74', '#FFFBF7', '#FFFFFF', '#1A1A1A', '#78716C', '#10B981', '#EAB308', '#DC2626', '#3B82F6', false, false, NOW(), NOW());
" > /dev/null 2>&1

echo ""
echo -e "${GREEN}✅ Temas creados exitosamente${NC}"
echo ""

# Mostrar resumen
echo -e "${BLUE}📊 Temas disponibles:${NC}"
echo ""

PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    id,
    name,
    \"primaryColor\" as primary,
    \"isDefault\" as \"default\"
FROM themes 
ORDER BY \"isDefault\" DESC, id;
"

echo ""
echo -e "${YELLOW}💡 USO:${NC}"
echo ""
echo "  • El tema 'Blanco y Azul Profesional' es el tema por defecto"
echo "  • Cada configuración de municipio puede seleccionar su tema"
echo "  • Los municipios pueden crear temas personalizados"
echo ""