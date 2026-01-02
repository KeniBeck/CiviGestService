#!/bin/bash

# Script para crear USUARIO Super Administrador (nivel SUPER_ADMIN)
# Este usuario tiene acceso completo al sistema

set -e

echo "🚀 Creando Usuario Super Administrador..."
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

# Datos genéricos del Super Administrador
USER_EMAIL="admin@example.com"
USER_USERNAME="superadmin"
USER_PASSWORD="root1234"
USER_FIRSTNAME="Super"
USER_LASTNAME="Administrador"
USER_PHONE="0000000000"
USER_CURP="SAXX000000XXXXXX00"

echo -e "${BLUE}📋 Datos del Super Administrador:${NC}"
echo "   Email: $USER_EMAIL"
echo "   Username: $USER_USERNAME"
echo "   Nombre: $USER_FIRSTNAME $USER_LASTNAME"
echo ""

# Hash del password usando Node.js (bcrypt)
echo -e "${BLUE}🔐 Generando hash de contraseña...${NC}"
PASSWORD_HASH=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('$USER_PASSWORD', 10).then(hash => console.log(hash))")

# Script SQL
SQL_SCRIPT=$(cat <<EOF
-- ============================================
-- CREAR USUARIO SUPER ADMINISTRADOR
-- ============================================

DO \$\$
DECLARE
    v_sede_id INTEGER;
    v_user_id INTEGER;
    v_role_id INTEGER;
BEGIN
    -- ============================================
    -- 1. OBTENER O CREAR SEDE POR DEFECTO
    -- ============================================
    -- Buscar la primera sede activa o crear una sede "Sistema"
    SELECT id INTO v_sede_id FROM sedes WHERE "isActive" = true ORDER BY id LIMIT 1;
    
    IF v_sede_id IS NULL THEN
        INSERT INTO sedes (name, code, "isActive", "createdAt", "updatedAt")
        VALUES ('Sistema', 'SYS', true, NOW(), NOW())
        RETURNING id INTO v_sede_id;
        RAISE NOTICE '✅ Sede Sistema creada con ID: %', v_sede_id;
    ELSE
        RAISE NOTICE '✅ Usando sede existente ID: %', v_sede_id;
    END IF;
    
    -- ============================================
    -- 2. VERIFICAR SI EL USUARIO YA EXISTE
    -- ============================================
    SELECT id INTO v_user_id FROM users WHERE email = '$USER_EMAIL' AND "isActive" = true;
    
    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE '⚠️  Usuario Super Admin ya existe con ID: %. No se creará duplicado.', v_user_id;
    ELSE
        -- ============================================
        -- 3. CREAR USUARIO SUPER ADMIN
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
            address,
            "documentType",
            "documentNumber",
            "isEmailVerified",
            "isPhoneVerified",
            "accessLevel",
            "isActive",
            "createdAt",
            "updatedAt"
        )
        VALUES (
            v_sede_id,
            NULL, -- Super admin no está ligado a una subsede específica
            '$USER_EMAIL',
            '$USER_USERNAME',
            '$PASSWORD_HASH',
            '$USER_FIRSTNAME',
            '$USER_LASTNAME',
            '+52',
            '$USER_PHONE',
            NULL,
            'CURP',
            '$USER_CURP',
            true, -- Email verificado
            true, -- Teléfono verificado
            'SEDE', -- Acceso nivel SEDE (acceso completo)
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (email) DO NOTHING
        RETURNING id INTO v_user_id;
        
        IF v_user_id IS NULL THEN
            -- Si hubo conflicto con username o documentNumber
            SELECT id INTO v_user_id FROM users WHERE email = '$USER_EMAIL';
            IF v_user_id IS NULL THEN
                RAISE EXCEPTION 'Error: No se pudo crear el usuario';
            END IF;
        END IF;
        
        RAISE NOTICE '✅ Usuario creado con ID: %', v_user_id;
    END IF;
    
    -- ============================================
    -- 4. OBTENER O CREAR ROL SUPER_ADMIN
    -- ============================================
    SELECT id INTO v_role_id FROM roles WHERE name = 'Super Administrador';
    
    IF v_role_id IS NULL THEN
        -- Crear el rol Super Administrador si no existe
        INSERT INTO roles (name, description, level, "isActive", "createdAt", "updatedAt")
        VALUES (
            'Super Administrador',
            'Administrador del sistema completo con acceso total',
            'SUPER_ADMIN',
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_role_id;
        RAISE NOTICE '✅ Rol Super Administrador creado con ID: %', v_role_id;
        
        -- Asignar TODOS los permisos al rol
        INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
        SELECT v_role_id, id, NOW(), 0
        FROM permissions
        WHERE "isActive" = true;
        
        RAISE NOTICE '✅ Todos los permisos asignados al rol';
    ELSE
        RAISE NOTICE '✅ Rol Super Administrador ya existe con ID: %', v_role_id;
    END IF;
    
    -- ============================================
    -- 5. ASIGNAR ROL AL USUARIO
    -- ============================================
    INSERT INTO user_roles ("userId", "roleId", "assignedAt", "assignedBy", "isActive")
    VALUES (v_user_id, v_role_id, NOW(), 0, true)
    ON CONFLICT ("userId", "roleId") DO NOTHING;
    
    RAISE NOTICE '✅ Rol asignado al usuario';
    
    -- ============================================
    -- 6. OTORGAR ACCESO A TODAS LAS SEDES
    -- ============================================
    INSERT INTO user_sede_access ("userId", "sedeId", "grantedAt", "grantedBy", "isActive")
    SELECT v_user_id, id, NOW(), 0, true
    FROM sedes
    WHERE "isActive" = true
    ON CONFLICT ("userId", "sedeId") DO NOTHING;
    
    RAISE NOTICE '✅ Acceso otorgado a todas las sedes';
    
END \$\$;

-- ============================================
-- 7. MOSTRAR RESUMEN
-- ============================================
SELECT 
    u.id as "ID",
    u.email as "Email",
    u.username as "Username",
    u."firstName" || ' ' || u."lastName" as "Nombre Completo",
    u."accessLevel" as "Nivel Acceso",
    s.name as "Sede",
    STRING_AGG(r.name, ', ') as "Roles"
FROM users u
INNER JOIN sedes s ON u."sedeId" = s.id
LEFT JOIN user_roles ur ON u.id = ur."userId"
LEFT JOIN roles r ON ur."roleId" = r.id
WHERE u.email = '$USER_EMAIL'
GROUP BY u.id, u.email, u.username, u."firstName", u."lastName", u."accessLevel", s.name;
EOF
)

# Ejecutar SQL
echo -e "${BLUE}💾 Ejecutando script SQL...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$SQL_SCRIPT" 2>&1

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Usuario Super Administrador creado exitosamente!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}📋 Datos del usuario:${NC}"
    echo "   Email: $USER_EMAIL"
    echo "   Username: $USER_USERNAME"
    echo "   Password: $USER_PASSWORD"
    echo "   Nombre: $USER_FIRSTNAME $USER_LASTNAME"
    echo "   Nivel: SUPER_ADMIN"
    echo "   Acceso: SEDE (Todas las sedes)"
    echo ""
    echo -e "${YELLOW}🔐 Credenciales de acceso:${NC}"
    echo "   Email: $USER_EMAIL"
    echo "   Password: $USER_PASSWORD"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "   • Este usuario tiene acceso COMPLETO al sistema"
    echo "   • Puede gestionar TODAS las sedes, usuarios, roles y permisos"
    echo "   • Guarda las credenciales en un lugar seguro"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error al crear el usuario Super Administrador${NC}"
    echo -e "${YELLOW}Verifica que:${NC}"
    echo "  1. PostgreSQL esté corriendo"
    echo "  2. Las migraciones estén aplicadas: npx prisma migrate deploy"
    echo "  3. DATABASE_URL sea correcto en .env"
    echo "  4. El email y username no estén duplicados"
    echo "  5. Tienes bcrypt instalado: npm install bcrypt"
    exit 1
fi
