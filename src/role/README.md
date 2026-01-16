# Módulo de Roles - CiviGest

## 📋 Descripción

Sistema de gestión de roles con niveles jerárquicos de permisos. Cada nivel de usuario tiene acceso controlado a ciertos niveles de roles.

---

## 🔐 Niveles de Permisos

### Jerarquía de Niveles

```
SUPER_ADMIN (Nivel 1 - Más alto)
    ↓
ESTATAL (Nivel 2)
    ↓
MUNICIPAL (Nivel 3)
    ↓
OPERATIVO (Nivel 4 - Más bajo)
```

---

## 📊 Matriz de Permisos

| Nivel de Usuario | Roles que puede VER | Roles que puede CREAR/EDITAR |
|------------------|---------------------|------------------------------|
| **SUPER_ADMIN**  | ✅ Todos            | ✅ Todos                     |
| **ESTATAL**      | ESTATAL, MUNICIPAL  | ESTATAL, MUNICIPAL           |
| **MUNICIPAL**    | MUNICIPAL, OPERATIVO| MUNICIPAL, OPERATIVO         |
| **OPERATIVO**    | OPERATIVO           | ❌ Ninguno (solo lectura)    |

---

## 🎯 Reglas de Negocio

### 1. **SUPER_ADMIN** (Administrador del Sistema)
- ✅ Acceso total sin restricciones
- ✅ Puede ver, crear, editar y eliminar roles de CUALQUIER nivel
- ✅ Único nivel que puede gestionar roles `SUPER_ADMIN`

### 2. **ESTATAL** (Administrador Estatal/Departamental)
- ✅ Puede ver y gestionar roles: `ESTATAL` y `MUNICIPAL`
- ❌ NO puede ver ni gestionar roles: `SUPER_ADMIN` ni `OPERATIVO`
- 🎯 **Caso de uso**: Admin estatal crea roles para administradores municipales

### 3. **MUNICIPAL** (Administrador Municipal)
- ✅ Puede ver y gestionar roles: `MUNICIPAL` y `OPERATIVO`
- ❌ NO puede ver ni gestionar roles: `SUPER_ADMIN` ni `ESTATAL`
- 🎯 **Caso de uso**: Admin municipal crea roles para usuarios operativos de su municipio

### 4. **OPERATIVO** (Usuario Operativo)
- ✅ Puede ver SOLO roles: `OPERATIVO`
- ❌ NO puede crear, editar ni eliminar ningún rol
- 🎯 **Caso de uso**: Usuario operativo solo consulta información

---

## 📁 Estructura del Módulo

```
src/role/
├── dto/
│   ├── create-role.dto.ts          # DTO para crear roles
│   ├── update-role.dto.ts          # DTO para actualizar roles
│   └── filter-roles.dto.ts         # DTO para filtros y paginación
├── entities/
│   └── role.entity.ts              # Entidad de respuesta
├── service/
│   ├── role.service.ts             # Lógica de creación/actualización/eliminación
│   └── role-finder.service.ts      # Lógica de consultas (GET)
├── role.controller.ts              # Endpoints REST
└── role.module.ts                  # Módulo de NestJS
```

---

## 🔧 Endpoints

### 1. **Crear Rol**
```http
POST /roles
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Administrador Municipal Tehuacán",
  "description": "Rol para administrador del municipio de Tehuacán",
  "level": "MUNICIPAL",
  "isActive": true
}
```

**Validaciones**:
- ✅ El usuario debe tener permisos para crear ese nivel de rol
- ✅ El nombre del rol debe ser único
- ✅ Usuario MUNICIPAL NO puede crear roles SUPER_ADMIN ni ESTATAL

---

### 2. **Obtener Todos los Roles (con paginación)**
```http
GET /roles?page=1&limit=10&search=Admin&level=MUNICIPAL&isActive=true
Authorization: Bearer {token}
```

**Respuesta**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Administrador Municipal",
      "description": "Rol para administradores municipales",
      "level": "MUNICIPAL",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Filtros automáticos**:
- Usuario `ESTATAL`: Solo ve roles ESTATAL y MUNICIPAL
- Usuario `MUNICIPAL`: Solo ve roles MUNICIPAL y OPERATIVO
- Usuario `OPERATIVO`: Solo ve roles OPERATIVO

---

### 3. **Obtener Roles Disponibles (sin paginación)**
```http
GET /roles/available
Authorization: Bearer {token}
```

**Uso**: Para llenar selects/dropdowns al asignar roles a usuarios.

---

### 4. **Obtener Estadísticas por Nivel**
```http
GET /roles/stats/by-level
Authorization: Bearer {token}
```

**Respuesta**:
```json
{
  "total": 25,
  "byLevel": {
    "SUPER_ADMIN": 2,
    "ESTATAL": 5,
    "MUNICIPAL": 10,
    "OPERATIVO": 8
  }
}
```

---

### 5. **Obtener Rol por ID**
```http
GET /roles/:id
Authorization: Bearer {token}
```

**Validación**: El usuario debe tener permisos para ver ese nivel de rol.

---

### 6. **Actualizar Rol**
```http
PATCH /roles/:id
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Nuevo Nombre",
  "description": "Nueva descripción",
  "level": "OPERATIVO"
}
```

**Validaciones**:
- ✅ El usuario debe tener permisos para el nivel actual Y el nuevo nivel
- ✅ Si cambia el nombre, debe verificar que no exista
- ✅ Usuario MUNICIPAL puede cambiar de MUNICIPAL → OPERATIVO, pero NO a ESTATAL

---

### 7. **Desactivar Rol**
```http
DELETE /roles/:id
Authorization: Bearer {token}
```

**Validaciones**:
- ✅ El usuario debe tener permisos para ese nivel de rol
- ✅ El rol NO debe estar asignado a ningún usuario activo
- 📝 **Nota**: No elimina el rol, solo lo desactiva (isActive = false)

---

### 8. **Reactivar Rol**
```http
PATCH /roles/:id/activate
Authorization: Bearer {token}
```

---

## 🧪 Ejemplos de Uso

### Ejemplo 1: Admin Estatal crea rol Municipal

```typescript
// Usuario: admin-estatal@estado.gob.mx (nivel ESTATAL)
POST /roles
{
  "name": "Administrador Municipal Puebla",
  "level": "MUNICIPAL"  // ✅ Permitido
}

// ❌ Error si intenta:
{
  "name": "Super Administrador 2",
  "level": "SUPER_ADMIN"  // ❌ Prohibido
}
```

---

### Ejemplo 2: Admin Municipal crea rol Operativo

```typescript
// Usuario: admin-municipal@municipio.gob.mx (nivel MUNICIPAL)
POST /roles
{
  "name": "Cajero Municipal",
  "level": "OPERATIVO"  // ✅ Permitido
}

// ❌ Error si intenta:
{
  "name": "Admin Estatal",
  "level": "ESTATAL"  // ❌ Prohibido
}
```

---

### Ejemplo 3: Usuario Operativo consulta roles

```typescript
// Usuario: operador@municipio.gob.mx (nivel OPERATIVO)
GET /roles  // ✅ Solo ve roles OPERATIVO

GET /roles/1  // ❌ Error si el rol 1 es MUNICIPAL o superior
```

---

## 🔍 Validaciones Implementadas

### En el Frontend (recomendadas)
```typescript
// Ocultar opciones según nivel del usuario
const canCreateRole = (userLevel: RoleLevel, roleLevel: RoleLevel) => {
  if (userLevel === 'SUPER_ADMIN') return true;
  if (userLevel === 'ESTATAL') return ['ESTATAL', 'MUNICIPAL'].includes(roleLevel);
  if (userLevel === 'MUNICIPAL') return ['MUNICIPAL', 'OPERATIVO'].includes(roleLevel);
  return false;
};
```

### En el Backend (obligatorias)
- ✅ Validación en `role.service.ts` → `validateCanManageRoleLevel()`
- ✅ Validación en `role-finder.service.ts` → `validateRoleLevelAccess()`
- ✅ Filtros automáticos en `role-pagination.service.ts`

---

## 🚨 Errores Comunes

### 1. **ForbiddenException: No tienes permisos para gestionar roles de este nivel**
**Causa**: Usuario intenta crear/editar un rol de nivel superior o no permitido.

**Solución**: Verificar que el nivel del rol esté dentro de los permisos del usuario.

---

### 2. **ConflictException: Ya existe un rol con el nombre "..."**
**Causa**: Nombre de rol duplicado.

**Solución**: Usar un nombre único para el rol.

---

### 3. **BadRequestException: No se puede eliminar el rol porque está asignado a X usuario(s)**
**Causa**: Rol tiene usuarios activos asignados.

**Solución**: Reasignar usuarios a otro rol antes de eliminar.

---

### 4. **NotFoundException: No tienes permisos para ver este rol**
**Causa**: Usuario intenta acceder a un rol de nivel no permitido.

**Solución**: Solo solicitar roles dentro del nivel de permisos del usuario.

---

## 📚 Dependencias

- `@nestjs/common`
- `@prisma/client`
- `class-validator`
- `class-transformer`

---

## 🧩 Integración con Otros Módulos

### 1. **Módulo de Usuarios**
```typescript
// Al asignar rol a un usuario, validar nivel
const userRole = await roleService.findOne(roleId, adminRoleLevel);
// Solo si el admin tiene permisos para ese nivel de rol
```

### 2. **Módulo de Autenticación**
```typescript
// Decorador para extraer roleLevel del usuario autenticado
@GetRoleLevel() userRoleLevel: RoleLevel
```

### 3. **Guards y Decoradores**
```typescript
@Roles('SUPER_ADMIN', 'ESTATAL')  // Solo estos niveles
@UseGuards(JwtAuthGuard, RolesGuard)
```

---

## 🔄 Flujo de Trabajo Típico

### Caso: Crear estructura de roles para un nuevo municipio

```
1. SUPER_ADMIN crea sede (estado)
   ↓
2. SUPER_ADMIN crea rol ESTATAL para ese estado
   ↓
3. SUPER_ADMIN asigna rol ESTATAL a un usuario
   ↓
4. Usuario ESTATAL crea subsede (municipio)
   ↓
5. Usuario ESTATAL crea rol MUNICIPAL para ese municipio
   ↓
6. Usuario ESTATAL asigna rol MUNICIPAL a un usuario
   ↓
7. Usuario MUNICIPAL crea roles OPERATIVO (Cajero, Atención, etc.)
   ↓
8. Usuario MUNICIPAL asigna roles OPERATIVO a usuarios finales
```

---

## 📝 Notas Importantes

1. **Los roles son globales**: No están asociados a sedes/subsedes específicas, solo tienen un nivel.

2. **Multi-tenancy se aplica en usuarios**: Los usuarios SÍ están asociados a sedes/subsedes.

3. **Un usuario puede tener múltiples roles**: Pero el nivel efectivo será el MÁS ALTO.

4. **Los roles OPERATIVO son específicos del municipio**: Aunque el modelo `Role` no tiene `subsedeId`, en la práctica cada municipio puede tener sus propios roles operativos con nombres únicos.

---

## 🎓 Glosario

- **SUPER_ADMIN**: Administrador del sistema completo (desarrolladores, soporte técnico)
- **ESTATAL**: Administrador de todo un estado/departamento
- **MUNICIPAL**: Administrador de un municipio específico
- **OPERATIVO**: Usuario final que opera el sistema (cajeros, atención al público, etc.)

---

## 📞 Soporte

Para más información o dudas sobre la implementación, consulta:
- Documentación de Prisma: https://www.prisma.io/docs
- Documentación de NestJS: https://docs.nestjs.com
