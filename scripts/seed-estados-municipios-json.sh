#!/bin/bash

# Script OPTIMIZADO para importar estados y municipios
# Corregido para manejar nombres con espacios

set -e

echo "🇲🇽 Importando Estados y Municipios de México desde INEGI..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Verificar jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ Error: jq no está instalado${NC}"
    echo "Instala jq con: sudo pacman -S jq"
    exit 1
fi

# Verificar archivo JSON
JSON_FILE="estados-municipios.json"

if [ ! -f "$JSON_FILE" ]; then
    echo -e "${RED}❌ Error: No se encontró el archivo $JSON_FILE${NC}"
    echo ""
    echo -e "${BLUE}📥 Descargando archivo...${NC}"
    curl -L "https://raw.githubusercontent.com/cisnerosnow/json-estados-municipios-mexico/master/estados-municipios.json" -o "$JSON_FILE"
    echo -e "${GREEN}✅ Archivo descargado${NC}"
    echo ""
fi

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
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Test conexión
if ! PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se puede conectar a PostgreSQL${NC}"
    echo "Verifica que PostgreSQL esté corriendo: sudo systemctl status postgresql"
    exit 1
fi

echo -e "${GREEN}✅ Conexión exitosa${NC}"
echo ""

# Mapeo de estados
declare -A ESTADO_TO_CODIGO=(
    ["Aguascalientes"]="AGS"
    ["Baja California"]="BC"
    ["Baja California Sur"]="BCS"
    ["Campeche"]="CAMP"
    ["Coahuila"]="COAH"
    ["Colima"]="COL"
    ["Chiapas"]="CHIS"
    ["Chihuahua"]="CHIH"
    ["Ciudad de Mexico"]="CDMX"
    ["Durango"]="DGO"
    ["Guanajuato"]="GTO"
    ["Guerrero"]="GRO"
    ["Hidalgo"]="HGO"
    ["Jalisco"]="JAL"
    ["Estado de Mexico"]="MEX"
    ["Michoacan"]="MICH"
    ["Morelos"]="MOR"
    ["Nayarit"]="NAY"
    ["Nuevo Leon"]="NL"
    ["Oaxaca"]="OAX"
    ["Puebla"]="PUE"
    ["Queretaro"]="QRO"
    ["Quintana Roo"]="QROO"
    ["San Luis Potosi"]="SLP"
    ["Sinaloa"]="SIN"
    ["Sonora"]="SON"
    ["Tabasco"]="TAB"
    ["Tamaulipas"]="TAMPS"
    ["Tlaxcala"]="TLAX"
    ["Veracruz"]="VER"
    ["Yucatan"]="YUC"
    ["Zacatecas"]="ZAC"
)

TOTAL_ESTADOS=$(jq 'keys | length' "$JSON_FILE")
echo -e "${BLUE}📊 Estados en JSON: $TOTAL_ESTADOS${NC}"
echo ""

echo -e "${YELLOW}⚠️  Este proceso insertará 32 estados y ~2,469 municipios${NC}"
read -p "¿Deseas continuar? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo -e "${YELLOW}❌ Operación cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}💾 Generando SQL...${NC}"
echo ""

# Función para escapar SQL
escape_sql() {
    echo "$1" | sed "s/'/''/g"
}

# Crear archivo SQL temporal
SQL_FILE=$(mktemp)
echo "-- Script generado automáticamente para insertar estados y municipios" > "$SQL_FILE"
echo "BEGIN;" >> "$SQL_FILE"

COUNT_ESTADOS=0
COUNT_MUNICIPIOS=0

# Procesar cada estado - CORREGIDO para manejar espacios
echo -e "${CYAN}Generando inserts...${NC}"

while IFS= read -r NOMBRE_ESTADO; do
    CODIGO_CORTO="${ESTADO_TO_CODIGO[$NOMBRE_ESTADO]}"
    
    if [ -z "$CODIGO_CORTO" ]; then
        echo -e "${YELLOW}⚠️  Estado no mapeado: '$NOMBRE_ESTADO'${NC}"
        continue
    fi
    
    NOMBRE_ESTADO_ESCAPED=$(escape_sql "$NOMBRE_ESTADO")
    
    echo -e "   📍 $NOMBRE_ESTADO ($CODIGO_CORTO)"
    
    # Insert del estado con CTE para obtener el ID
    cat >> "$SQL_FILE" <<EOF

-- Estado: $NOMBRE_ESTADO
WITH sede_insert AS (
    INSERT INTO sedes (name, code, email, "phoneCountryCode", "phoneNumber", address, city, state, "isActive", "createdAt", "updatedAt")
    VALUES ('$NOMBRE_ESTADO_ESCAPED', '$CODIGO_CORTO', 'contacto@${CODIGO_CORTO,,}.gob.mx', '+52', '0000000000', 'Palacio de Gobierno', '$NOMBRE_ESTADO_ESCAPED', '$NOMBRE_ESTADO_ESCAPED', true, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE 
    SET name = EXCLUDED.name, "updatedAt" = NOW()
    RETURNING id
)
INSERT INTO subsedes ("sedeId", name, code, "isActive", "createdAt", "updatedAt")
SELECT 
    sede_insert.id,
    municipio.nombre,
    municipio.codigo,
    true,
    NOW(),
    NOW()
FROM sede_insert, (VALUES
EOF
    
    # Obtener municipios y generar los VALUES
    MUNICIPIO_INDEX=1
    NUM_MUNICIPIOS=$(jq -r ".\"$NOMBRE_ESTADO\" | length" "$JSON_FILE")
    
    # Guardar municipios en un archivo temporal para evitar problemas con subshell
    TEMP_MUNICIPIOS=$(mktemp)
    jq -r ".\"$NOMBRE_ESTADO\"[]" "$JSON_FILE" > "$TEMP_MUNICIPIOS"
    
    while IFS= read -r NOMBRE_MUNICIPIO; do
        CODIGO_MUNICIPIO=$(printf "%03d" $MUNICIPIO_INDEX)
        NOMBRE_MUNICIPIO_ESCAPED=$(escape_sql "$NOMBRE_MUNICIPIO")
        
        if [ $MUNICIPIO_INDEX -eq $NUM_MUNICIPIOS ]; then
            # Último municipio, sin coma
            echo "    ('$NOMBRE_MUNICIPIO_ESCAPED', '$CODIGO_MUNICIPIO')" >> "$SQL_FILE"
        else
            # Con coma
            echo "    ('$NOMBRE_MUNICIPIO_ESCAPED', '$CODIGO_MUNICIPIO')," >> "$SQL_FILE"
        fi
        
        MUNICIPIO_INDEX=$((MUNICIPIO_INDEX + 1))
    done < "$TEMP_MUNICIPIOS"
    
    rm -f "$TEMP_MUNICIPIOS"
    
    echo ") AS municipio(nombre, codigo)" >> "$SQL_FILE"
    echo "ON CONFLICT (\"sedeId\", code) DO UPDATE SET name = EXCLUDED.name, \"updatedAt\" = NOW();" >> "$SQL_FILE"
    
    COUNT_ESTADOS=$((COUNT_ESTADOS + 1))
    COUNT_MUNICIPIOS=$((COUNT_MUNICIPIOS + NUM_MUNICIPIOS))
    
done < <(jq -r 'keys[]' "$JSON_FILE")

echo "COMMIT;" >> "$SQL_FILE"

echo ""
echo -e "${GREEN}✅ SQL generado: $COUNT_ESTADOS estados, $COUNT_MUNICIPIOS municipios${NC}"
echo ""

# Mostrar cuántos municipios faltaron si no son 32 estados
if [ $COUNT_ESTADOS -ne 32 ]; then
    echo -e "${YELLOW}⚠️  Advertencia: Solo se procesaron $COUNT_ESTADOS de 32 estados${NC}"
    FALTANTES=$((32 - COUNT_ESTADOS))
    echo -e "${YELLOW}   Faltan $FALTANTES estados${NC}"
    echo ""
fi

echo -e "${BLUE}🚀 Ejecutando inserts en PostgreSQL...${NC}"
echo ""

# Ejecutar el SQL
START_TIME=$(date +%s)

if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SQL_FILE" > /dev/null 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo -e "${GREEN}✅ Inserción completada en $DURATION segundos${NC}"
    echo ""
else
    echo -e "${RED}❌ Error al ejecutar SQL${NC}"
    echo "Archivo SQL guardado en: $SQL_FILE"
    echo "Puedes revisarlo manualmente o ejecutarlo con:"
    echo "psql -U $DB_USER -d $DB_NAME -f $SQL_FILE"
    exit 1
fi

# Limpiar archivo temporal solo si todo salió bien
rm -f "$SQL_FILE"

# Verificar totales
echo -e "${BLUE}📊 Verificando base de datos...${NC}"
echo ""

TOTAL_SEDES=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM sedes WHERE code != 'SYSTEM';" | xargs)
TOTAL_SUBSEDES=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM subsedes;" | xargs)

echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Importación completada exitosamente${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📋 Estadísticas finales:${NC}"
echo "   • Estados (Sedes): $TOTAL_SEDES/32"
echo "   • Municipios (Subsedes): $TOTAL_SUBSEDES/2,469"
echo ""

if [ "$TOTAL_SEDES" -eq 32 ]; then
    echo -e "${GREEN}🎉 ¡Perfecto! Los 32 estados están completos${NC}"
else
    echo -e "${YELLOW}⚠️  Faltan $((32 - TOTAL_SEDES)) estados${NC}"
fi

if [ "$TOTAL_SUBSEDES" -ge 2460 ]; then
    echo -e "${GREEN}🎉 ¡Excelente! Todos los municipios están cargados ($TOTAL_SUBSEDES)${NC}"
elif [ "$TOTAL_SUBSEDES" -ge 2400 ]; then
    echo -e "${YELLOW}⚠️  Se cargaron $TOTAL_SUBSEDES de ~2,469 municipios esperados${NC}"
else
    echo -e "${RED}⚠️  Solo se cargaron $TOTAL_SUBSEDES municipios (se esperaban ~2,469)${NC}"
fi

echo ""
echo -e "${BLUE}💡 Siguiente paso:${NC}"
echo "   ./scripts/create-superadmin.sh"
echo "   ./scripts/create-admin-estatal.sh"
echo "   ./scripts/create-admin-municipal.sh"
echo ""