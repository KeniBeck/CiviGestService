#!/bin/bash

# ============================================
# Script para crear roles base del sistema
# ============================================
# Crea los siguientes roles si no existen:
# - Super Administrador (SUPER_ADMIN)
# - Administrador Estatal (ESTATAL)
# - Administrador Municipal (MUNICIPAL)
# - Operativo (OPERATIVO)
#
# Y asigna TODOS los permisos existentes a cada uno

set -e

echo "🚀 Iniciando creación de roles base del sistema..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

# Script SQL
SQL_SCRIPT=$(cat <<'EOF'
-- ============================================
-- CREAR ROLES BASE DEL SISTEMA
-- ============================================
-- Crea los roles si no existen y asigna todos los permisos
-- Usa la clave compuesta: [name, sedeId, subsedeId]

DO $$
DECLARE
    v_role_id INTEGER;
    v_permisos_count INTEGER;
    v_total_permisos INTEGER;
    v_roles_creados INTEGER := 0;
    v_roles_actualizados INTEGER := 0;
BEGIN
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '🚀 INICIANDO CREACIÓN DE ROLES BASE';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Contar permisos existentes
    SELECT COUNT(*) INTO v_total_permisos FROM permissions WHERE "isActive" = true;
    RAISE NOTICE '📋 Total de permisos activos en el sistema: %', v_total_permisos;
    RAISE NOTICE '';
    
    -- ============================================
    -- 1. ROL: SUPER ADMINISTRADOR
    -- ============================================
    RAISE NOTICE '🔧 Procesando: Super Administrador';
    
    -- Verificar si ya existe (roles globales tienen sedeId y subsedeId NULL)
    SELECT id INTO v_role_id 
    FROM roles 
    WHERE name = 'Super Administrador' 
      AND "sedeId" IS NULL 
      AND "subsedeId" IS NULL
      AND "isGlobal" = true;
    
    IF v_role_id IS NULL THEN
        -- Crear el rol
        INSERT INTO roles (name, description, level, "isActive", "isGlobal", "sedeId", "subsedeId", "createdAt", "updatedAt")
        VALUES (
            'Super Administrador',
            'Administrador del sistema completo con acceso total',
            'SUPER_ADMIN',
            true,
            true,
            NULL,
            NULL,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_role_id;
        
        v_roles_creados := v_roles_creados + 1;
        RAISE NOTICE '   ✅ Rol creado (ID: %)', v_role_id;
    ELSE
        -- Actualizar descripción
        UPDATE roles SET
            description = 'Administrador del sistema completo con acceso total',
            level = 'SUPER_ADMIN',
            "updatedAt" = NOW()
        WHERE id = v_role_id;
        
        v_roles_actualizados := v_roles_actualizados + 1;
        RAISE NOTICE '   ✓ Rol ya existe (ID: %)', v_role_id;
    END IF;
    
    -- Asignar TODOS los permisos
    INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
    SELECT v_role_id, p.id, NOW(), 1
    FROM permissions p
    WHERE p."isActive" = true
    ON CONFLICT ("roleId", "permissionId") DO NOTHING;
    
    SELECT COUNT(*) INTO v_permisos_count 
    FROM role_permissions 
    WHERE "roleId" = v_role_id;
    
    RAISE NOTICE '   📊 Total de permisos: %/%', v_permisos_count, v_total_permisos;
    RAISE NOTICE '';
    
    -- ============================================
    -- 2. ROL: ADMINISTRADOR ESTATAL
    -- ============================================
    RAISE NOTICE '🔧 Procesando: Administrador Estatal';
    
    SELECT id INTO v_role_id 
    FROM roles 
    WHERE name = 'Administrador Estatal' 
      AND "sedeId" IS NULL 
      AND "subsedeId" IS NULL
      AND "isGlobal" = true;
    
    IF v_role_id IS NULL THEN
        INSERT INTO roles (name, description, level, "isActive", "isGlobal", "sedeId", "subsedeId", "createdAt", "updatedAt")
        VALUES (
            'Administrador Estatal',
            'Administrador de nivel estatal con acceso a toda la sede',
            'ESTATAL',
            true,
            true,
            NULL,
            NULL,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_role_id;
        
        v_roles_creados := v_roles_creados + 1;
        RAISE NOTICE '   ✅ Rol creado (ID: %)', v_role_id;
    ELSE
        UPDATE roles SET
            description = 'Administrador de nivel estatal con acceso a toda la sede',
            level = 'ESTATAL',
            "updatedAt" = NOW()
        WHERE id = v_role_id;
        
        v_roles_actualizados := v_roles_actualizados + 1;
        RAISE NOTICE '   ✓ Rol ya existe (ID: %)', v_role_id;
    END IF;
    
    -- Asignar TODOS los permisos
    INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
    SELECT v_role_id, p.id, NOW(), 1
    FROM permissions p
    WHERE p."isActive" = true
    ON CONFLICT ("roleId", "permissionId") DO NOTHING;
    
    SELECT COUNT(*) INTO v_permisos_count 
    FROM role_permissions 
    WHERE "roleId" = v_role_id;
    
    RAISE NOTICE '   📊 Total de permisos: %/%', v_permisos_count, v_total_permisos;
    RAISE NOTICE '';
    
    -- ============================================
    -- 3. ROL: ADMINISTRADOR MUNICIPAL
    -- ============================================
    RAISE NOTICE '🔧 Procesando: Administrador Municipal';
    
    SELECT id INTO v_role_id 
    FROM roles 
    WHERE name = 'Administrador Municipal' 
      AND "sedeId" IS NULL 
      AND "subsedeId" IS NULL
      AND "isGlobal" = true;
    
    IF v_role_id IS NULL THEN
        INSERT INTO roles (name, description, level, "isActive", "isGlobal", "sedeId", "subsedeId", "createdAt", "updatedAt")
        VALUES (
            'Administrador Municipal',
            'Administrador de nivel municipal con acceso a su municipio',
            'MUNICIPAL',
            true,
            true,
            NULL,
            NULL,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_role_id;
        
        v_roles_creados := v_roles_creados + 1;
        RAISE NOTICE '   ✅ Rol creado (ID: %)', v_role_id;
    ELSE
        UPDATE roles SET
            description = 'Administrador de nivel municipal con acceso a su municipio',
            level = 'MUNICIPAL',
            "updatedAt" = NOW()
        WHERE id = v_role_id;
        
        v_roles_actualizados := v_roles_actualizados + 1;
        RAISE NOTICE '   ✓ Rol ya existe (ID: %)', v_role_id;
    END IF;
    
    -- Asignar TODOS los permisos
    INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
    SELECT v_role_id, p.id, NOW(), 1
    FROM permissions p
    WHERE p."isActive" = true
    ON CONFLICT ("roleId", "permissionId") DO NOTHING;
    
    SELECT COUNT(*) INTO v_permisos_count 
    FROM role_permissions 
    WHERE "roleId" = v_role_id;
    
    RAISE NOTICE '   📊 Total de permisos: %/%', v_permisos_count, v_total_permisos;
    RAISE NOTICE '';
    
    -- ============================================
    -- 4. ROL: OPERATIVO
    -- ============================================
    RAISE NOTICE '🔧 Procesando: Operativo';
    
    SELECT id INTO v_role_id 
    FROM roles 
    WHERE name = 'Operativo' 
      AND "sedeId" IS NULL 
      AND "subsedeId" IS NULL
      AND "isGlobal" = true;
    
    IF v_role_id IS NULL THEN
        INSERT INTO roles (name, description, level, "isActive", "isGlobal", "sedeId", "subsedeId", "createdAt", "updatedAt")
        VALUES (
            'Operativo',
            'Usuario operativo con permisos de lectura y operación básica',
            'OPERATIVO',
            true,
            true,
            NULL,
            NULL,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_role_id;
        
        v_roles_creados := v_roles_creados + 1;
        RAISE NOTICE '   ✅ Rol creado (ID: %)', v_role_id;
    ELSE
        UPDATE roles SET
            description = 'Usuario operativo con permisos de lectura y operación básica',
            level = 'OPERATIVO',
            "updatedAt" = NOW()
        WHERE id = v_role_id;
        
        v_roles_actualizados := v_roles_actualizados + 1;
        RAISE NOTICE '   ✓ Rol ya existe (ID: %)', v_role_id;
    END IF;
    
    -- Asignar permisos de lectura (read) a todos los recursos
    INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
    SELECT v_role_id, p.id, NOW(), 1
    FROM permissions p
    WHERE p."isActive" = true
      AND p.action = 'read'
    ON CONFLICT ("roleId", "permissionId") DO NOTHING;
    
    SELECT COUNT(*) INTO v_permisos_count 
    FROM role_permissions 
    WHERE "roleId" = v_role_id;
    
    RAISE NOTICE '   📊 Total de permisos: % (solo lectura)', v_permisos_count;
    RAISE NOTICE '';

    -- ============================================
    -- 5. ROL: AGENTE DE TRÁNSITO
    -- ============================================
    RAISE NOTICE '🔧 Procesando: Agente de Tránsito';

    -- Verificar si ya existe (roles globales tienen sedeId y subsedeId NULL)
    SELECT id INTO v_role_id
    FROM roles
    WHERE name = 'Agente de Tránsito'
      AND "sedeId" IS NULL
      AND "subsedeId" IS NULL
      AND "isGlobal" = true;

    IF v_role_id IS NULL THEN
        INSERT INTO roles (name, description, level, "isActive", "isGlobal", "sedeId", "subsedeId", "createdAt", "updatedAt")
        VALUES (
            'Agente de Tránsito',
            'Agente autorizado para generar infracciones de tránsito',
            'OPERATIVO',
            true,
            true,
            NULL,
            NULL,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_role_id;

        v_roles_creados := v_roles_creados + 1;
        RAISE NOTICE '   ✅ Rol creado (ID: %)', v_role_id;
    ELSE
        UPDATE roles SET
            description = 'Agente autorizado para generar infracciones de tránsito',
            level = 'OPERATIVO',
            "updatedAt" = NOW()
        WHERE id = v_role_id;

        v_roles_actualizados := v_roles_actualizados + 1;
        RAISE NOTICE '   ✓ Rol ya existe (ID: %)', v_role_id;
    END IF;

    -- Asegurar permisos específicos existen: infraccion:create y infraccion:read
    IF NOT EXISTS (SELECT 1 FROM permissions p WHERE p.resource = 'infraccion' AND p.action = 'create') THEN
        INSERT INTO permissions (resource, action, description, level, "isActive", "createdAt", "updatedAt")
        VALUES ('infraccion', 'create', 'Crear infracciones en campo', 'OPERATIVO', true, NOW(), NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM permissions p WHERE p.resource = 'infraccion' AND p.action = 'read') THEN
        INSERT INTO permissions (resource, action, description, level, "isActive", "createdAt", "updatedAt")
        VALUES ('infraccion', 'read', 'Ver infracciones propias', 'OPERATIVO', true, NOW(), NOW());
    END IF;

    -- Asignar los permisos de infracciones al rol de agente
    INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt", "grantedBy")
    SELECT v_role_id, p.id, NOW(), 1
    FROM permissions p
    WHERE p.resource = 'infraccion'
      AND p.action IN ('create', 'read')
    ON CONFLICT ("roleId", "permissionId") DO NOTHING;

    SELECT COUNT(*) INTO v_permisos_count
    FROM role_permissions
    WHERE "roleId" = v_role_id;

    RAISE NOTICE '   📊 Permisos asignados a Agente de Tránsito: %', v_permisos_count;
    RAISE NOTICE '';
    
    -- ============================================
    -- RESUMEN FINAL
    -- ============================================
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '✅ PROCESO COMPLETADO';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '   Roles creados: %', v_roles_creados;
    RAISE NOTICE '   Roles actualizados: %', v_roles_actualizados;
    RAISE NOTICE '   Total de permisos en sistema: %', v_total_permisos;
    RAISE NOTICE '';
    
END $$;

-- ============================================
-- MOSTRAR RESUMEN DE ROLES
-- ============================================
SELECT 
    r.name AS "Rol",
    r.level AS "Nivel",
    r."isGlobal" AS "Global",
    r."isActive" AS "Activo",
    COUNT(rp.id) AS "Permisos",
    COUNT(ur.id) AS "Usuarios"
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp."roleId"
LEFT JOIN user_roles ur ON r.id = ur."roleId" AND ur."isActive" = true
WHERE r."isGlobal" = true 
  AND r."sedeId" IS NULL 
  AND r."subsedeId" IS NULL
GROUP BY r.id, r.name, r.level, r."isGlobal", r."isActive"
ORDER BY 
    CASE r.level
        WHEN 'SUPER_ADMIN' THEN 1
        WHEN 'ESTATAL' THEN 2
        WHEN 'MUNICIPAL' THEN 3
        WHEN 'OPERATIVO' THEN 4
    END;
EOF
)

# Ejecutar SQL
echo -e "${BLUE}💾 Ejecutando script SQL...${NC}"
echo ""
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$SQL_SCRIPT" 2>&1

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 ¡Roles base creados exitosamente!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}📋 Roles del sistema:${NC}"
    echo ""
    echo -e "${BLUE}  1. Super Administrador${NC} (SUPER_ADMIN)"
    echo "     • Acceso total al sistema"
    echo "     • Puede gestionar todas las sedes"
    echo "     • Todos los permisos asignados"
    echo ""
    echo -e "${BLUE}  2. Administrador Estatal${NC} (ESTATAL)"
    echo "     • Gestión completa de su sede"
    echo "     • Puede ver y gestionar roles de nivel igual o inferior"
    echo "     • Todos los permisos asignados"
    echo ""
    echo -e "${BLUE}  3. Administrador Municipal${NC} (MUNICIPAL)"
    echo "     • Gestión completa de su municipio"
    echo "     • Puede gestionar roles municipales y operativos"
    echo "     • Todos los permisos asignados"
    echo ""
    echo -e "${BLUE}  4. Operativo${NC} (OPERATIVO)"
    echo "     • Permisos de solo lectura"
    echo "     • Operación básica del sistema"
    echo "     • Solo permisos 'read' asignados"
    echo ""
    echo -e "${YELLOW}💡 Próximos pasos:${NC}"
    echo ""
    echo "  1. Asignar roles a usuarios:"
    echo -e "${CYAN}     INSERT INTO user_roles (\"userId\", \"roleId\", \"assignedAt\", \"assignedBy\", \"isActive\")${NC}"
    echo -e "${CYAN}     SELECT <USER_ID>, id, NOW(), 1, true${NC}"
    echo -e "${CYAN}     FROM roles WHERE name = 'Super Administrador' AND \"isGlobal\" = true;${NC}"
    echo ""
    echo "  2. Verificar permisos de un rol:"
    echo -e "${CYAN}     SELECT p.resource, p.action, p.description${NC}"
    echo -e "${CYAN}     FROM permissions p${NC}"
    echo -e "${CYAN}     INNER JOIN role_permissions rp ON p.id = rp.\"permissionId\"${NC}"
    echo -e "${CYAN}     INNER JOIN roles r ON rp.\"roleId\" = r.id${NC}"
    echo -e "${CYAN}     WHERE r.name = 'Super Administrador' AND r.\"isGlobal\" = true;${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ Error al crear roles base${NC}"
    echo -e "${RED}════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}🔍 Verifica que:${NC}"
    echo "  1. PostgreSQL esté corriendo"
    echo "  2. Las migraciones estén aplicadas:"
    echo -e "     ${CYAN}npx prisma migrate deploy${NC}"
    echo "  3. DATABASE_URL sea correcto en .env"
    echo "  4. Existan permisos en la tabla 'permissions'"
    echo ""
    echo -e "${YELLOW}💡 Para crear permisos básicos, ejecuta:${NC}"
    echo -e "     ${CYAN}./scripts/create-super-admin.sh${NC}"
    echo ""
    exit 1
fi
