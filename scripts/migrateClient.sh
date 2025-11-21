#!/bin/bash

# Script para crear ROL Super Admin y USUARIO superadmin
# NO requiere Sede porque SUPER_ADMIN tiene acceso a TODO

set -e

echo "🚀 Creando ROL Super Admin y USUARIO superadmin..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

# Credenciales del superadmin
ADMIN_EMAIL="superadmin@civigest.com"
ADMIN_USERNAME="superadmin"
ADMIN_PASSWORD="SuperAdmin123!"
ADMIN_FIRSTNAME="Super"
ADMIN_LASTNAME="Administrador"
ADMIN_DOCUMENT="SUPERADMIN001"

# Generar hash de contraseña con Node.js (bcrypt)
echo -e "${BLUE}🔐 Generando hash de contraseña...${NC}"
PASSWORD_HASH=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('$ADMIN_PASSWORD', 10).then(console.log)")

# Script SQL - ORDEN CORRECTO
SQL_SCRIPT=$(cat <<EOF
-- ============================================
-- 1. CREAR SEDE DEL SISTEMA (PRIMERO)
-- ============================================
INSERT INTO sedes (
    id,
    name,
    code,
    email,
    "phoneCountryCode",
    "phoneNumber",
    address,
    city,
    state,
    "isActive",
    "createdAt",
    "updatedAt"
)
VALUES (
    1,
    'Sistema CiviGest',
    'SYSTEM',
    'sistema@civigest.com',
    '+52',
    '0000000000',
    'Sistema',
    'Sistema',
    'Sistema',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CREAR ROL SUPER_ADMIN
-- ============================================
INSERT INTO roles (name, description, level, "isActive", "createdAt", "updatedAt")
VALUES (
    'Super Administrador',
    'Administrador del sistema completo con acceso total',
    'SUPER_ADMIN',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. CREAR PERMISOS Y ASIGNAR AL ROL
-- ============================================
DO \$\$
DECLARE
    v_role_id INTEGER;
    v_user_id INTEGER;
BEGIN
    -- Obtener ID del rol
    SELECT id INTO v_role_id FROM roles WHERE name = 'Super Administrador';
    
    -- Crear permisos básicos
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES 
        ('all', 'manage', 'Acceso total al sistema', true, NOW(), NOW()),
        ('sedes', 'manage', 'Gestionar sedes', true, NOW(), NOW()),
        ('users', 'manage', 'Gestionar usuarios', true, NOW(), NOW()),
        ('roles', 'manage', 'Gestionar roles', true, NOW(), NOW()),
        ('settings', 'manage', 'Gestionar configuración', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- Asignar permisos al rol
    INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
    SELECT 
        v_role_id,
        p.id,
        NOW(),
        0
    FROM permissions p
    WHERE p.resource IN ('all', 'sedes', 'users', 'roles', 'settings')
    ON CONFLICT ("roleId", "permissionId") DO NOTHING;
    
    -- ============================================
    -- 4. CREAR USUARIO SUPER_ADMIN
    -- ============================================
    INSERT INTO users (
        "sedeId",
        "subsedeId",
        email,
        username,
        password,
        "firstName",
        "lastName",
        "phoneCountryCode",
        "phoneNumber",
        "documentType",
        "documentNumber",
        "accessLevel",
        "isEmailVerified",
        "isActive",
        "createdAt",
        "updatedAt",
        "createdBy"
    )
    VALUES (
        1, -- sedeId del Sistema CiviGest (creado arriba)
        NULL,
        '$ADMIN_EMAIL',
        '$ADMIN_USERNAME',
        '$PASSWORD_HASH',
        '$ADMIN_FIRSTNAME',
        '$ADMIN_LASTNAME',
        '+52',
        '0000000000',
        'CURP',
        '$ADMIN_DOCUMENT',
        'SEDE',
        true,
        true,
        NOW(),
        NOW(),
        NULL
    )
    ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        "updatedAt" = NOW()
    RETURNING id INTO v_user_id;
    
    -- Si el usuario ya existía, obtener su ID
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users WHERE email = '$ADMIN_EMAIL';
    END IF;
    
    -- ============================================
    -- 5. ASIGNAR ROL AL USUARIO
    -- ============================================
    INSERT INTO user_roles ("userId", "roleId", "assignedAt", "assignedBy", "isActive")
    VALUES (
        v_user_id,
        v_role_id,
        NOW(),
        0,
        true
    )
    ON CONFLICT ("userId", "roleId") DO NOTHING;
    
    -- ============================================
    -- 6. OTORGAR ACCESO A TODAS LAS SEDES EXISTENTES
    -- ============================================
    INSERT INTO user_sede_access ("userId", "sedeId", "grantedAt", "grantedBy", "isActive")
    SELECT 
        v_user_id,
        s.id,
        NOW(),
        0,
        true
    FROM sedes s
    ON CONFLICT ("userId", "sedeId") DO NOTHING;
    
    RAISE NOTICE '✅ Sede del sistema creada con ID: 1';
    RAISE NOTICE '✅ Rol Super Administrador creado con ID: %', v_role_id;
    RAISE NOTICE '✅ Usuario Super Admin creado/actualizado con ID: %', v_user_id;
    RAISE NOTICE '✅ Acceso otorgado a todas las sedes';
END \$\$;
EOF
)

# Ejecutar SQL
echo -e "${BLUE}💾 Ejecutando script SQL...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$SQL_SCRIPT" 2>&1 | grep -E "(INSERT|NOTICE|ERROR)" || true

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Super Admin creado exitosamente!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}📋 Credenciales de acceso:${NC}"
    echo ""
    echo "  Email:    $ADMIN_EMAIL"
    echo "  Username: $ADMIN_USERNAME"
    echo "  Password: $ADMIN_PASSWORD"
    echo ""
    echo -e "${BLUE}📍 Sede del Sistema:${NC}"
    echo "  ID:   1"
    echo "  Name: Sistema CiviGest"
    echo "  Code: SYSTEM"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "  1. Cambia la contraseña después del primer login"
    echo "  2. Este usuario tiene acceso TOTAL al sistema"
    echo "  3. Tiene acceso a TODAS las sedes (actuales y futuras)"
    echo ""
    echo -e "${BLUE}🚀 Para probar:${NC}"
    echo "  npm run start:dev"
    echo ""
    echo "  curl -X POST http://localhost:3000/auth/login \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}'"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error al crear el usuario Super Admin${NC}"
    echo -e "${YELLOW}Verifica que:${NC}"
    echo "  1. PostgreSQL esté corriendo"
    echo "  2. Las migraciones estén aplicadas: npx prisma migrate deploy"
    echo "  3. DATABASE_URL sea correcto en .env"
    exit 1
fi