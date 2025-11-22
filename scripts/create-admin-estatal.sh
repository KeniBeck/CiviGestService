#!/bin/bash

# Script para crear ROL Administrador Estatal (nivel SEDE)
# Este rol tiene acceso a gestionar usuarios, roles y configuración dentro de su sede

set -e

echo "🚀 Creando ROL Administrador Estatal..."
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

# Script SQL
SQL_SCRIPT=$(cat <<EOF
-- ============================================
-- CREAR ROL ADMINISTRADOR ESTATAL (NIVEL SEDE)
-- ============================================
-- Este rol puede gestionar:
-- - Usuarios de su sede
-- - Roles (asignar roles de menor nivel)
-- - Configuración de su sede
-- NO puede gestionar:
-- - Otras sedes
-- - Permisos del sistema (all, sedes)

DO \$\$
DECLARE
    v_role_id INTEGER;
    v_perm_id INTEGER;
BEGIN
    -- ============================================
    -- 1. CREAR ROL ADMINISTRADOR ESTATAL
    -- ============================================
    INSERT INTO roles (name, description, level, "isActive", "createdAt", "updatedAt")
    VALUES (
        'Administrador Estatal',
        'Administrador de sede/departamento con acceso a gestión de usuarios, roles y configuración dentro de su sede',
        'ESTATAL',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        level = EXCLUDED.level,
        "updatedAt" = NOW()
    RETURNING id INTO v_role_id;
    
    -- Si ya existía, obtener su ID
    IF v_role_id IS NULL THEN
        SELECT id INTO v_role_id FROM roles WHERE name = 'Administrador Estatal';
    END IF;
    
    RAISE NOTICE '✅ Rol Administrador Estatal ID: %', v_role_id;
    
    -- ============================================
    -- 2. CREAR PERMISOS DE USUARIOS (CRUD)
    -- ============================================
    -- Crear
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('users', 'create', 'Crear usuarios en su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- Leer
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('users', 'read', 'Ver usuarios de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- Actualizar
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('users', 'update', 'Actualizar usuarios de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- Eliminar
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('users', 'delete', 'Eliminar usuarios de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- ============================================
    -- 3. CREAR PERMISOS DE ROLES (CRUD)
    -- ============================================
    -- Crear
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('roles', 'create', 'Crear roles dentro de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- Leer
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('roles', 'read', 'Ver roles disponibles', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- Actualizar
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('roles', 'update', 'Actualizar roles de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- Eliminar
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('roles', 'delete', 'Eliminar roles de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- Asignar roles a usuarios
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('roles', 'assign', 'Asignar roles a usuarios de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- ============================================
    -- 4. CREAR PERMISOS DE SETTINGS (CRUD)
    -- ============================================
    -- Crear
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('settings', 'create', 'Crear configuraciones de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- Leer
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('settings', 'read', 'Ver configuración de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- Actualizar
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('settings', 'update', 'Actualizar configuración de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- Eliminar
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('settings', 'delete', 'Eliminar configuraciones de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- ============================================
    -- 5. CREAR PERMISOS DE SUBSEDES (CRUD)
    -- ============================================
    -- El admin estatal puede gestionar las subsedes de su sede
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('subsedes', 'create', 'Crear subsedes/municipios en su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('subsedes', 'read', 'Ver subsedes/municipios de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('subsedes', 'update', 'Actualizar subsedes/municipios de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    INSERT INTO permissions (resource, action, description, "isActive", "createdAt", "updatedAt")
    VALUES ('subsedes', 'delete', 'Eliminar subsedes/municipios de su sede', true, NOW(), NOW())
    ON CONFLICT (resource, action) DO NOTHING;
    
    -- ============================================
    -- 6. ASIGNAR PERMISOS AL ROL
    -- ============================================
    -- Limpiar permisos anteriores del rol (para evitar duplicados)
    DELETE FROM role_permissions WHERE "roleId" = v_role_id;
    
    -- Asignar permisos de USERS
    INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
    SELECT v_role_id, id, NOW(), 0
    FROM permissions
    WHERE resource = 'users' AND action IN ('create', 'read', 'update', 'delete');
    
    -- Asignar permisos de ROLES
    INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
    SELECT v_role_id, id, NOW(), 0
    FROM permissions
    WHERE resource = 'roles' AND action IN ('create', 'read', 'update', 'delete', 'assign');
    
    -- Asignar permisos de SETTINGS
    INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
    SELECT v_role_id, id, NOW(), 0
    FROM permissions
    WHERE resource = 'settings' AND action IN ('create', 'read', 'update', 'delete');
    
    -- Asignar permisos de SUBSEDES
    INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
    SELECT v_role_id, id, NOW(), 0
    FROM permissions
    WHERE resource = 'subsedes' AND action IN ('create', 'read', 'update', 'delete');
    
    RAISE NOTICE '✅ Permisos asignados al rol Administrador Estatal';
    
END \$\$;

-- ============================================
-- 7. MOSTRAR RESUMEN
-- ============================================
SELECT 
    r.name as "Rol",
    r.level as "Nivel",
    COUNT(rp.id) as "Total Permisos"
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp."roleId"
WHERE r.name = 'Administrador Estatal'
GROUP BY r.id, r.name, r.level;

-- Mostrar permisos asignados
SELECT 
    p.resource as "Recurso",
    p.action as "Acción",
    p.description as "Descripción"
FROM permissions p
INNER JOIN role_permissions rp ON p.id = rp."permissionId"
INNER JOIN roles r ON rp."roleId" = r.id
WHERE r.name = 'Administrador Estatal'
ORDER BY p.resource, p.action;
EOF
)

# Ejecutar SQL
echo -e "${BLUE}💾 Ejecutando script SQL...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$SQL_SCRIPT" 2>&1

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Rol Administrador Estatal creado exitosamente!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}📋 Permisos asignados:${NC}"
    echo ""
    echo "  📁 USERS (usuarios):"
    echo "     • create - Crear usuarios en su sede"
    echo "     • read   - Ver usuarios de su sede"
    echo "     • update - Actualizar usuarios de su sede"
    echo "     • delete - Eliminar usuarios de su sede"
    echo ""
    echo "  📁 ROLES:"
    echo "     • create - Crear roles dentro de su sede"
    echo "     • read   - Ver roles disponibles"
    echo "     • update - Actualizar roles de su sede"
    echo "     • delete - Eliminar roles de su sede"
    echo "     • assign - Asignar roles a usuarios"
    echo ""
    echo "  📁 SETTINGS (configuración):"
    echo "     • create - Crear configuraciones"
    echo "     • read   - Ver configuración"
    echo "     • update - Actualizar configuración"
    echo "     • delete - Eliminar configuraciones"
    echo ""
    echo "  📁 SUBSEDES (municipios):"
    echo "     • create - Crear subsedes/municipios"
    echo "     • read   - Ver subsedes/municipios"
    echo "     • update - Actualizar subsedes/municipios"
    echo "     • delete - Eliminar subsedes/municipios"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "  • Este rol solo puede gestionar datos DENTRO de su sede"
    echo "  • NO tiene acceso a otras sedes ni al sistema completo"
    echo "  • Para asignar este rol a un usuario, usa:"
    echo ""
    echo -e "${BLUE}    INSERT INTO user_roles (\"userId\", \"roleId\", \"assignedAt\", \"assignedBy\", \"isActive\")${NC}"
    echo -e "${BLUE}    SELECT <USER_ID>, id, NOW(), <ADMIN_ID>, true${NC}"
    echo -e "${BLUE}    FROM roles WHERE name = 'Administrador Estatal';${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error al crear el rol Administrador Estatal${NC}"
    echo -e "${YELLOW}Verifica que:${NC}"
    echo "  1. PostgreSQL esté corriendo"
    echo "  2. Las migraciones estén aplicadas: npx prisma migrate deploy"
    echo "  3. DATABASE_URL sea correcto en .env"
    exit 1
fi