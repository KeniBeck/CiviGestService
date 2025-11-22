# Módulo de Usuarios - CiviGest

## Descripción
Módulo completo de gestión de usuarios con control de acceso basado en roles (RBAC) y jerarquías de permisos.

## Estructura del Módulo

```
src/user/
├── user.controller.ts       # Endpoints REST para gestión de usuarios
├── user.service.ts          # Lógica de negocio (CRUD)
├── user.module.ts           # Configuración del módulo
├── dto/
│   ├── create-user.dto.ts   # DTO para crear usuarios
│   └── update-user.dto.ts   # DTO para actualizar usuarios
├── entities/
│   └── user.entity.ts       # Entidad de usuario (excluye campos sensibles)
└── service/
    └── finder-user.service.ts # Servicio de búsqueda y listado
```

## Jerarquía de Roles y Permisos

### 1. Super Administrador
- **Nivel:** SUPER_ADMIN
- **Alcance:** TODO el sistema
- **Permisos:**
  - Crear/actualizar usuarios en cualquier sede/subsede
  - Asignar CUALQUIER rol (incluido Super Administrador)
  - Gestionar usuarios con accesos cross-tenant
  - Ver y modificar todos los usuarios del sistema

### 2. Administrador Estatal (SEDE)
- **Nivel:** ESTATAL
- **Alcance:** Su sede y subsedes asociadas
- **Permisos:**
  - Crear/actualizar usuarios en su sede
  - Asignar roles: ESTATAL, MUNICIPAL, OPERATIVO
  - **NO puede** asignar rol de Super Administrador
  - Ver usuarios de su sede y subsedes

### 3. Administrador Municipal (SUBSEDE)
- **Nivel:** MUNICIPAL
- **Alcance:** Su subsede únicamente
- **Permisos:**
  - Crear/actualizar usuarios en su subsede
  - Asignar roles: MUNICIPAL, OPERATIVO
  - **NO puede** asignar roles ESTATAL ni Super Administrador
  - Ver usuarios de su subsede

### 4. Usuario Operativo
- **Nivel:** OPERATIVO
- **Alcance:** Sin permisos de gestión de usuarios
- **Permisos:**
  - **NO puede** crear ni gestionar usuarios
  - Solo puede realizar operaciones específicas de su rol

## Validaciones Implementadas

### En Creación (`create`)

#### 1. Validación de Alcance
```typescript
// Usuario ESTATAL solo puede crear en su sede
if (createUserDto.sedeId !== creatorSedeId) {
  throw new ForbiddenException();
}

// Usuario MUNICIPAL solo puede crear en su subsede
if (createUserDto.subsedeId !== creatorSubsedeId) {
  throw new ForbiddenException();
}
```

#### 2. Validación de Unicidad
- Email único en el sistema
- Username único en el sistema
- Número de documento único

#### 3. Validación de Jerarquía de Roles
```typescript
// Solo Super Admin puede asignar Super Administrador
if (hasSuperAdminRole && !isSuperAdmin) {
  throw new ForbiddenException();
}

// Validar niveles permitidos por rol del creador
if (creatorAccessLevel === AccessLevel.SEDE) {
  // Puede asignar: ESTATAL, MUNICIPAL, OPERATIVO
}
else if (creatorAccessLevel === AccessLevel.SUBSEDE) {
  // Puede asignar: MUNICIPAL, OPERATIVO
}
```

### En Actualización (`update`)

#### 1. Validación de Acceso
- Super Admin: puede actualizar cualquier usuario
- ESTATAL: solo usuarios de su sede
- MUNICIPAL: solo usuarios de su subsede

#### 2. Validación de Roles
- Mismas validaciones que en creación
- No se puede cambiar la sede del usuario
- Se puede cambiar la subsede si pertenece a la misma sede

#### 3. Protecciones Especiales
```typescript
// No se puede eliminar a uno mismo
if (id === deleterId) {
  throw new BadRequestException();
}

// No se puede desactivar a uno mismo
if (id === updaterId && user.isActive) {
  throw new BadRequestException();
}
```

## Endpoints

### POST /users
- **Descripción:** Crear nuevo usuario
- **Permisos:** `users:create`
- **Roles permitidos:** Super Admin, ESTATAL, MUNICIPAL

### GET /users
- **Descripción:** Listar usuarios con filtros
- **Permisos:** `users:read`
- **Filtros opcionales:**
  - `sedeId`: Filtrar por sede
  - `subsedeId`: Filtrar por subsede
  - `isActive`: Filtrar por estado activo/inactivo
  - `search`: Búsqueda por nombre, email o username

### GET /users/sede/:sedeId
- **Descripción:** Listar usuarios de una sede específica
- **Permisos:** `users:read`
- **Roles permitidos:** Super Admin, ESTATAL (si tiene acceso)

### GET /users/subsede/:subsedeId
- **Descripción:** Listar usuarios de una subsede específica
- **Permisos:** `users:read`
- **Roles permitidos:** Super Admin, ESTATAL, MUNICIPAL

### GET /users/:id
- **Descripción:** Obtener un usuario por ID
- **Permisos:** `users:read`
- **Validación de acceso:** Solo si el usuario está en alcance

### PATCH /users/:id
- **Descripción:** Actualizar usuario
- **Permisos:** `users:update`
- **Validaciones:** Jerarquía de roles y alcance

### PATCH /users/:id/toggle-active
- **Descripción:** Activar/desactivar usuario
- **Permisos:** `users:update`
- **Protección:** No puede desactivarse a sí mismo

### DELETE /users/:id
- **Descripción:** Soft delete de usuario
- **Permisos:** `users:delete`
- **Protección:** No puede eliminarse a sí mismo

## Flujo de Datos

### Creación de Usuario
```
1. Validar alcance (sede/subsede del creador)
2. Validar unicidad (email, username, documento)
3. Validar que sede y subsede existan
4. Validar roles a asignar (jerarquía)
5. Hashear contraseña (bcrypt)
6. Crear usuario en transacción:
   - Crear registro de usuario
   - Asignar roles
   - Asignar accesos explícitos (si aplica)
7. Retornar usuario con relaciones
```

### Actualización de Usuario
```
1. Buscar usuario existente
2. Validar acceso según nivel del actualizador
3. Validar cambios de unicidad
4. Validar cambios de subsede
5. Actualizar en transacción:
   - Actualizar datos básicos
   - Reemplazar roles (si se especifican)
   - Reemplazar accesos explícitos (si se especifican)
6. Retornar usuario actualizado
```

## Casos de Uso

### 1. Super Admin crea usuario ESTATAL
```typescript
POST /users
{
  "sedeId": 1,
  "email": "admin.chiapas@civigest.com",
  "username": "admin_chiapas",
  "password": "SecurePass123!",
  "firstName": "Admin",
  "lastName": "Chiapas",
  "documentType": "CURP",
  "documentNumber": "XXXX000000XXXXXX00",
  "accessLevel": "SEDE",
  "roleIds": [2], // Rol ESTATAL
  "phoneNumber": "9611234567"
}
```

### 2. Admin ESTATAL crea usuario MUNICIPAL
```typescript
POST /users
{
  "sedeId": 1, // Debe ser su propia sede
  "subsedeId": 5,
  "email": "admin.tuxtla@civigest.com",
  "username": "admin_tuxtla",
  "password": "SecurePass123!",
  "firstName": "Admin",
  "lastName": "Tuxtla",
  "documentType": "CURP",
  "documentNumber": "YYYY000000YYYYYY00",
  "accessLevel": "SUBSEDE",
  "roleIds": [3], // Rol MUNICIPAL
  "phoneNumber": "9617654321"
}
```

### 3. Admin MUNICIPAL crea usuario OPERATIVO
```typescript
POST /users
{
  "sedeId": 1,
  "subsedeId": 5, // Debe ser su propia subsede
  "email": "operador@civigest.com",
  "username": "operador_tuxtla",
  "password": "SecurePass123!",
  "firstName": "Operador",
  "lastName": "García",
  "documentType": "INE",
  "documentNumber": "123456789",
  "accessLevel": "SUBSEDE",
  "roleIds": [4], // Rol OPERATIVO
  "phoneNumber": "9619876543"
}
```

## Seguridad

### Protecciones Implementadas
1. ✅ No se puede asignar Super Admin sin ser Super Admin
2. ✅ Validación de jerarquía de roles (ESTATAL → MUNICIPAL → OPERATIVO)
3. ✅ No se puede crear usuarios fuera de alcance
4. ✅ No se puede eliminar/desactivar a uno mismo
5. ✅ Contraseñas hasheadas con bcrypt (10 rounds)
6. ✅ Soft delete para mantener histórico
7. ✅ Validación de sede/subsede activas
8. ✅ Tokens JWT con información de acceso (evita queries repetitivas)

### Control de Acceso en Token JWT
```typescript
interface RequestUser {
  userId: number;
  sedeId: number;
  subsedeId: number | null;
  accessLevel: AccessLevel;
  roles: string[];
  permissions: string[];
  sedeAccessIds: number[];      // IDs de sedes con acceso explícito
  subsedeAccessIds: number[];   // IDs de subsedes con acceso explícito
}
```

## Dependencias
- `PrismaModule`: Acceso a base de datos
- `bcrypt`: Hash de contraseñas
- `@nestjs/swagger`: Documentación API
- `class-validator`: Validación de DTOs
- `class-transformer`: Transformación de datos

## Testing

### Casos de Prueba Recomendados
1. ✅ Super Admin puede crear cualquier usuario
2. ✅ ESTATAL puede crear ESTATAL, MUNICIPAL, OPERATIVO
3. ✅ ESTATAL NO puede crear Super Admin
4. ✅ MUNICIPAL puede crear MUNICIPAL y OPERATIVO
5. ✅ MUNICIPAL NO puede crear ESTATAL
6. ✅ OPERATIVO NO puede crear usuarios
7. ✅ No se puede crear usuario en sede diferente (sin ser Super Admin)
8. ✅ No se puede eliminar a uno mismo
9. ✅ Email/username/documento únicos
10. ✅ Contraseña hasheada correctamente

## Notas Importantes

### Tabla Users - NO usar particionamiento
❌ **NO** particionar la tabla `users` por sede/subsede
- Es una tabla de **datos maestros**, no transaccional
- Volumen de registros moderado (miles, no millones)
- Necesita consultas cross-tenant frecuentes
- El particionamiento complicaría el sistema de autenticación

### Tabla Particionamiento recomendado para:
✅ Multas, reportes, denuncias, incidentes, logs (datos transaccionales)
✅ Tablas con millones de registros
✅ Consultas mayormente por sede/período

## Próximos Pasos
- [ ] Implementar cambio de contraseña
- [ ] Implementar recuperación de contraseña con OTP
- [ ] Agregar verificación de email
- [ ] Implementar historial de cambios de usuario
- [ ] Agregar auditoría de acciones
