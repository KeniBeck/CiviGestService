#!/bin/bash

# Script para crear los TEMAS de colores de CiviGest
# Incluye 4 temas: Tinto (default), Azul, Verde, Naranja

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

echo -e "${BLUE}📡 Conectando a PostgreSQL...${NC}"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo ""

# Script SQL para crear los temas
SQL_SCRIPT=$(cat <<'EOF'
-- ============================================
-- TEMAS DE COLORES PARA CIVIGEST
-- ============================================

-- Limpiar temas por defecto existentes (no custom)
DELETE FROM themes WHERE "isCustom" = false;

-- ============================================
-- TEMA 1: TINTO ELEGANTE (DEFAULT)
-- ============================================
INSERT INTO themes (
    name,
    description,
    "primaryColor",
    "secondaryColor",
    "accentColor",
    "backgroundColor",
    "surfaceColor",
    "textPrimaryColor",
    "textSecondaryColor",
    "successColor",
    "warningColor",
    "errorColor",
    "infoColor",
    "darkMode",
    "isDefault",
    "isCustom",
    "sedeId",
    "createdAt",
    "updatedAt"
) VALUES (
    'Tinto Elegante',
    'Tema por defecto con tonos vino tinto, elegante y profesional',
    '#722F37',
    '#4A1C23',
    '#D4A5A5',
    '#FAFAFA',
    '#FFFFFF',
    '#1A1A1A',
    '#6B7280',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#3B82F6',
    false,
    true,
    false,
    NULL,
    NOW(),
    NOW()
);

-- ============================================
-- TEMA 2: AZUL CORPORATIVO
-- ============================================
INSERT INTO themes (
    name,
    description,
    "primaryColor",
    "secondaryColor",
    "accentColor",
    "backgroundColor",
    "surfaceColor",
    "textPrimaryColor",
    "textSecondaryColor",
    "successColor",
    "warningColor",
    "errorColor",
    "infoColor",
    "darkMode",
    "isDefault",
    "isCustom",
    "sedeId",
    "createdAt",
    "updatedAt"
) VALUES (
    'Azul Corporativo',
    'Tema azul profesional ideal para entornos corporativos',
    '#1E40AF',
    '#1E3A5F',
    '#93C5FD',
    '#F8FAFC',
    '#FFFFFF',
    '#0F172A',
    '#64748B',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#0EA5E9',
    false,
    false,
    false,
    NULL,
    NOW(),
    NOW()
);

-- ============================================
-- TEMA 3: VERDE NATURAL
-- ============================================
INSERT INTO themes (
    name,
    description,
    "primaryColor",
    "secondaryColor",
    "accentColor",
    "backgroundColor",
    "surfaceColor",
    "textPrimaryColor",
    "textSecondaryColor",
    "successColor",
    "warningColor",
    "errorColor",
    "infoColor",
    "darkMode",
    "isDefault",
    "isCustom",
    "sedeId",
    "createdAt",
    "updatedAt"
) VALUES (
    'Verde Natural',
    'Tema verde fresco, transmite confianza y naturalidad',
    '#166534',
    '#14532D',
    '#86EFAC',
    '#F8FDF9',
    '#FFFFFF',
    '#1A1A1A',
    '#4B5563',
    '#22C55E',
    '#F59E0B',
    '#EF4444',
    '#3B82F6',
    false,
    false,
    false,
    NULL,
    NOW(),
    NOW()
);

-- ============================================
-- TEMA 4: NARANJA ENERGÉTICO
-- ============================================
INSERT INTO themes (
    name,
    description,
    "primaryColor",
    "secondaryColor",
    "accentColor",
    "backgroundColor",
    "surfaceColor",
    "textPrimaryColor",
    "textSecondaryColor",
    "successColor",
    "warningColor",
    "errorColor",
    "infoColor",
    "darkMode",
    "isDefault",
    "isCustom",
    "sedeId",
    "createdAt",
    "updatedAt"
) VALUES (
    'Naranja Energético',
    'Tema naranja cálido, transmite energía y dinamismo',
    '#C2410C',
    '#9A3412',
    '#FDBA74',
    '#FFFBF7',
    '#FFFFFF',
    '#1A1A1A',
    '#78716C',
    '#10B981',
    '#EAB308',
    '#DC2626',
    '#3B82F6',
    false,
    false,
    false,
    NULL,
    NOW(),
    NOW()
);

-- ============================================
-- MOSTRAR RESUMEN
-- ============================================
SELECT 
    id,
    name,
    "primaryColor" as primary,
    "isDefault" as "default"
FROM themes 
WHERE "isCustom" = false
ORDER BY "isDefault" DESC, id;
EOF
)

# Ejecutar SQL
echo -e "${BLUE}💾 Ejecutando script SQL...${NC}"
echo ""

RESULT=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$SQL_SCRIPT" 2>&1)

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Temas de colores creados exitosamente!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}🎨 Temas disponibles:${NC}"
    echo ""
    echo -e "  ${MAGENTA}1. Tinto Elegante${NC}     #722F37  ${GREEN}(Por defecto)${NC}"
    echo -e "  ${CYAN}2. Azul Corporativo${NC}   #1E40AF"
    echo -e "  ${GREEN}3. Verde Natural${NC}      #166534"
    echo -e "  ${YELLOW}4. Naranja Energético${NC} #C2410C"
    echo ""
    echo -e "${BLUE}📊 Resultado de la consulta:${NC}"
    echo "$RESULT" | tail -n +1
    echo ""
    echo -e "${YELLOW}💡 USO:${NC}"
    echo ""
    echo "  • El tema 'Tinto Elegante' es el tema por defecto del sistema"
    echo "  • Cada sede puede seleccionar su tema preferido"
    echo "  • Las sedes pueden crear temas personalizados (isCustom=true)"
    echo ""
    echo -e "${BLUE}🔗 Endpoints sugeridos:${NC}"
    echo ""
    echo "  GET  /themes              - Listar todos los temas"
    echo "  GET  /themes/:id          - Obtener tema por ID"
    echo "  GET  /themes/default      - Obtener tema por defecto"
    echo "  POST /themes              - Crear tema personalizado"
    echo "  PUT  /sedes/:id/theme     - Asignar tema a una sede"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error al crear los temas${NC}"
    echo ""
    echo -e "${YELLOW}Verifica que:${NC}"
    echo "  1. PostgreSQL esté corriendo"
    echo "  2. La tabla 'themes' exista (ejecuta las migraciones)"
    echo "  3. DATABASE_URL sea correcto en .env"
    echo ""
    echo -e "${BLUE}Para aplicar migraciones:${NC}"
    echo "  npx prisma migrate deploy"
    echo ""
    echo -e "${RED}Error detallado:${NC}"
    echo "$RESULT"
    exit 1
fi