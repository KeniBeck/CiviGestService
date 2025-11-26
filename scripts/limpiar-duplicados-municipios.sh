#!/bin/bash

# Script para limpiar municipios duplicados
# Mantiene el registro más reciente por estado + nombre

set -e

echo "🧹 Limpieza de Municipios Duplicados"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Cargar .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    exit 1
fi

# Extraer datos de conexión
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

# Mostrar estadísticas antes
echo -e "${BLUE}📊 Estadísticas ANTES de la limpieza:${NC}"
TOTAL_ANTES=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM subsedes;" | xargs)
echo "   Total municipios: $TOTAL_ANTES"
echo ""

# Detectar duplicados
echo -e "${CYAN}🔍 Buscando duplicados...${NC}"
echo ""

QUERY_DUPLICADOS="
SELECT 
    s.name as estado,
    sub.name as municipio,
    COUNT(*) as veces
FROM subsedes sub
JOIN sedes s ON s.id = sub.\"sedeId\"
GROUP BY sub.\"sedeId\", s.name, sub.name
HAVING COUNT(*) > 1
ORDER BY veces DESC, s.name, sub.name;
"

DUPLICADOS=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*)
FROM (
    SELECT \"sedeId\", name
    FROM subsedes
    GROUP BY \"sedeId\", name
    HAVING COUNT(*) > 1
) duplicados;
" | xargs)

if [ "$DUPLICADOS" -eq 0 ]; then
    echo -e "${GREEN}✅ No se encontraron duplicados${NC}"
    echo ""
    exit 0
fi

echo -e "${YELLOW}⚠️  Encontrados $DUPLICADOS municipios duplicados:${NC}"
echo ""

# Mostrar duplicados
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$QUERY_DUPLICADOS"

echo ""
read -p "¿Deseas eliminar los duplicados? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo -e "${YELLOW}❌ Operación cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🗑️  Eliminando duplicados...${NC}"
echo "   (Manteniendo el registro más reciente por estado + nombre)"
echo ""

# Eliminar duplicados manteniendo el más reciente
SQL_DELETE="
DELETE FROM subsedes
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY \"sedeId\", name 
                   ORDER BY \"createdAt\" DESC, id DESC
               ) as rn
        FROM subsedes
    ) t
    WHERE t.rn > 1
);
"

ELIMINADOS=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "$SQL_DELETE" | grep -o '[0-9]\+' | head -1)

if [ -z "$ELIMINADOS" ]; then
    ELIMINADOS=0
fi

echo -e "${GREEN}✅ Eliminados $ELIMINADOS registros duplicados${NC}"
echo ""

# Mostrar estadísticas después
echo -e "${BLUE}📊 Estadísticas DESPUÉS de la limpieza:${NC}"
TOTAL_DESPUES=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM subsedes;" | xargs)
echo "   Total municipios: $TOTAL_DESPUES"
echo "   Registros eliminados: $((TOTAL_ANTES - TOTAL_DESPUES))"
echo ""

# Verificar por estado
echo -e "${BLUE}📋 Municipios por estado:${NC}"
echo ""

PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    s.name as estado,
    COUNT(sub.id) as total_municipios
FROM sedes s
LEFT JOIN subsedes sub ON sub.\"sedeId\" = s.id
WHERE s.code != 'SYSTEM'
GROUP BY s.id, s.name
ORDER BY s.name;
"

echo ""
echo -e "${GREEN}✅ Limpieza completada exitosamente${NC}"
echo ""
