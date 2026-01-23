#!/bin/bash

# Script para asignar TODOS los permisos activos a los roles base: Super Administrador, Administrador Estatal y Administrador Municipal
# El rol Operativo se gestiona manualmente

set -e

echo "🔑 Asignando permisos a roles base..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

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
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/(\[^?]*\).*/\1/p')

# Script SQL para asignar permisos
SQL_SCRIPT=$(cat <<'EOF'
DO $$
DECLARE
    v_role_id INTEGER;
    v_total_permisos INTEGER;
    v_permisos_count INTEGER;
BEGIN
    -- Contar permisos activos
    SELECT COUNT(*) INTO v_total_permisos FROM permissions WHERE "isActive" = true;

    -- Super Administrador
    SELECT id INTO v_role_id FROM roles WHERE name = 'Super Administrador' AND "isGlobal" = true AND "sedeId" IS NULL AND "subsedeId" IS NULL;
    IF v_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
        SELECT v_role_id, p.id, NOW(), 1 FROM permissions p WHERE p."isActive" = true
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        SELECT COUNT(*) INTO v_permisos_count FROM role_permissions WHERE "roleId" = v_role_id;
        RAISE NOTICE 'Super Administrador: %/% permisos asignados', v_permisos_count, v_total_permisos;
    END IF;

    -- Administrador Estatal
    SELECT id INTO v_role_id FROM roles WHERE name = 'Administrador Estatal' AND "isGlobal" = true AND "sedeId" IS NULL AND "subsedeId" IS NULL;
    IF v_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
        SELECT v_role_id, p.id, NOW(), 1 FROM permissions p WHERE p."isActive" = true
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        SELECT COUNT(*) INTO v_permisos_count FROM role_permissions WHERE "roleId" = v_role_id;
        RAISE NOTICE 'Administrador Estatal: %/% permisos asignados', v_permisos_count, v_total_permisos;
    END IF;

    -- Administrador Municipal
    SELECT id INTO v_role_id FROM roles WHERE name = 'Administrador Municipal' AND "isGlobal" = true AND "sedeId" IS NULL AND "subsedeId" IS NULL;
    IF v_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
        SELECT v_role_id, p.id, NOW(), 1 FROM permissions p WHERE p."isActive" = true
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        SELECT COUNT(*) INTO v_permisos_count FROM role_permissions WHERE "roleId" = v_role_id;
        RAISE NOTICE 'Administrador Municipal: %/% permisos asignados', v_permisos_count, v_total_permisos;
    END IF;
END $$;
EOF
)

# Ejecutar SQL
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$SQL_SCRIPT" 2>&1

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✅ Permisos asignados correctamente a roles base${NC}"
else
    echo -e "${RED}❌ Error al asignar permisos a roles base${NC}"
    exit 1
fi
