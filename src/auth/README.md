# 🔐 Sistema de Autenticación JWT - CiviGest

Sistema robusto de autenticación y autorización para la arquitectura multi-tenant de CiviGest.

## 📋 Características

✅ **Autenticación JWT** - Tokens seguros con información del usuario
✅ **Multi-tenant** - Aislamiento por departamento/tenant
✅ **RBAC** - Control de acceso basado en roles
✅ **Permisos granulares** - Control fino de permisos por recurso y acción
✅ **Acceso contextual** - Validación de acceso a sedes y subsedes
✅ **Guards personalizados** - Validación de roles, permisos y contexto
✅ **Decoradores** - Simplificación del código con decoradores reutilizables
✅ **Swagger integrado** - Documentación automática de la API

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     JWT Token (Header)                       │
├─────────────────────────────────────────────────────────────┤
│  Payload:                                                    │
│  - sub (userId)                                              │
│  - email, username                                           │
│  - tenantId, sedeId, subsedeId                              │
│  - accessLevel (TENANT | SEDE | SUBSEDE)                    │
│  - roles: ["Admin Estatal", "Operador"]                     │
│  - permissions: ["fines:create", "reports:read"]            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   JwtAuthGuard (Global)                      │
│  - Valida token JWT                                          │
│  - Adjunta usuario al request                                │
│  - Verifica usuario activo                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Guards Adicionales (Opcionales)                 │
│  - RolesGuard: Valida roles requeridos                      │
│  - PermissionsGuard: Valida permisos específicos            │
│  - TenantAccessGuard: Valida acceso a sede/subsede          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      Controller Action
```

## 🚀 Uso Básico

### 1. Login

```typescript
POST /auth/login
Content-Type: application/json

{
  "email": "admin@civigest.com",
  "password": "Admin123!"
}

// Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 604800,
  "user": {
    "id": 1,
    "email": "admin@civigest.com",
    "username": "admin",
    "tenantId": 1,
    "accessLevel": "TENANT",
    "roles": ["Super Administrador"]
  }
}
```

### 2. Usar el token en requests

```typescript
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎨 Decoradores Disponibles

### @Public()
Marca una ruta como pública (sin autenticación)

```typescript
@Public()
@Get('public-data')
getPublicData() {
  return { message: 'Datos públicos' };
}
```

### @CurrentUser()
Obtiene el usuario autenticado

```typescript
@Get('profile')
getProfile(@CurrentUser() user: RequestUser) {
  return user;
}

// O extraer un campo específico
@Get('tenant')
getTenant(@CurrentUser('tenantId') tenantId: number) {
  return { tenantId };
}
```

### @Roles()
Requiere al menos UNO de los roles especificados

```typescript
@Roles('Super Administrador', 'Administrador Estatal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('admin-only')
adminEndpoint() {
  return { message: 'Solo para admins' };
}
```

### @RequirePermissions()
Requiere TODOS los permisos especificados

```typescript
@RequirePermissions('fines:create', 'fines:update')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Post('fines')
createFine(@Body() data: CreateFineDto) {
  // Solo si tiene ambos permisos
}
```

### @TenantAccess (con Guard)
Valida acceso a sede/subsede

```typescript
@UseGuards(JwtAuthGuard, TenantAccessGuard)
@Get('sedes/:sedeId/fines')
getFinesBySede(@Param('sedeId') sedeId: number) {
  // Solo si tiene acceso a esa sede
}
```

## 🛡️ Guards (Guardias)

### JwtAuthGuard
**Aplicado globalmente** - Todas las rutas requieren autenticación por defecto.

```typescript
// No necesitas aplicarlo manualmente, ya está global
// Para rutas públicas, usa @Public()
```

### RolesGuard
Valida roles del usuario

```typescript
@Roles('Admin', 'Operador')
@UseGuards(RolesGuard) // JwtAuthGuard ya está global
@Get('protected')
protectedEndpoint() {}
```

### PermissionsGuard
Valida permisos específicos

```typescript
@RequirePermissions('fines:delete')
@UseGuards(PermissionsGuard)
@Delete('fines/:id')
deleteFine(@Param('id') id: number) {}
```

### TenantAccessGuard
Valida acceso contextual a sedes/subsedes

```typescript
@UseGuards(TenantAccessGuard)
@Get('subsedes/:subsedeId/reports')
getReports(@Param('subsedeId') subsedeId: number) {
  // Valida automáticamente si el usuario tiene acceso a esa subsede
}
```

## 📊 Niveles de Acceso

### TENANT
Acceso completo a todo el tenant (todos los estados y municipios)
- Usuarios: Super Administradores
- Sin restricciones de sede/subsede

### SEDE
Acceso a una o varias sedes (estados) específicas
- Usuarios: Administradores Estatales
- Se valida con `UserSedeAccess`

### SUBSEDE
Acceso a una o varias subsedes (municipios) específicas
- Usuarios: Operadores Municipales
- Se valida con `UserSubsedeAccess`

## 🔒 Flujo de Autorización Completo

```typescript
@Controller('fines')
export class FinesController {
  
  // 1. Solo autenticados (JwtAuthGuard global)
  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    // Filtrar por tenantId del usuario
  }

  // 2. Solo admins estatales o superiores
  @Roles('Super Administrador', 'Administrador Estatal')
  @UseGuards(RolesGuard)
  @Get('statistics')
  getStatistics() {}

  // 3. Requiere permiso específico
  @RequirePermissions('fines:create')
  @UseGuards(PermissionsGuard)
  @Post()
  create(@Body() data: CreateFineDto) {}

  // 4. Valida acceso a la subsede + permisos
  @RequirePermissions('fines:read')
  @UseGuards(PermissionsGuard, TenantAccessGuard)
  @Get('subsedes/:subsedeId')
  findBySubsede(@Param('subsedeId') subsedeId: number) {}

  // 5. Múltiples validaciones
  @Roles('Super Administrador')
  @RequirePermissions('fines:delete')
  @UseGuards(RolesGuard, PermissionsGuard, TenantAccessGuard)
  @Delete(':id')
  delete(@Param('id') id: number) {}
}
```

## 🎯 Ejemplos de Uso por Rol

### Super Administrador (TENANT)
```typescript
{
  accessLevel: "TENANT",
  tenantId: 1,
  roles: ["Super Administrador"],
  permissions: ["*:*"] // Todos los permisos
}

// Puede acceder a:
- Todas las sedes del tenant
- Todas las subsedes
- Todas las funcionalidades
```

### Administrador Estatal (SEDE)
```typescript
{
  accessLevel: "SEDE",
  tenantId: 1,
  sedeId: 5,
  roles: ["Administrador Estatal"],
  permissions: ["fines:*", "reports:read", "users:read"]
}

// Con registros en UserSedeAccess:
- sedeId: 5, 7, 12

// Puede acceder a:
- Solo las 3 sedes asignadas
- Todas las subsedes de esas sedes
- Funcionalidades según permisos
```

### Operador Municipal (SUBSEDE)
```typescript
{
  accessLevel: "SUBSEDE",
  tenantId: 1,
  sedeId: 5,
  subsedeId: 8,
  roles: ["Operador Municipal"],
  permissions: ["fines:create", "fines:read", "citizens:read"]
}

// Con registros en UserSubsedeAccess:
- subsedeId: 8, 15

// Puede acceder a:
- Solo las 2 subsedes asignadas
- Funcionalidades limitadas según permisos
```

## 🧪 Testing

```typescript
// Obtener token para tests
const response = await request(app.getHttpServer())
  .post('/auth/login')
  .send({
    email: 'test@civigest.com',
    password: 'Test123!'
  });

const token = response.body.accessToken;

// Usar en requests
await request(app.getHttpServer())
  .get('/protected-endpoint')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);
```

## 🔧 Configuración

### Variables de Entorno (.env)
```env
# JWT
JWT_SECRET="tu-secreto-super-seguro"
JWT_EXPIRES_IN="7d"

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/civigest"

# App
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="*"
```

## 📚 Recursos Adicionales

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Prueba de endpoints**: Usa el botón "Authorize" en Swagger
- **Generar token manualmente**: Endpoint `/auth/login`

## 🚨 Seguridad

✅ Contraseñas hasheadas con bcrypt (10 rounds)
✅ Tokens JWT firmados
✅ Validación de usuario y tenant activos
✅ Protección contra inyección SQL (Prisma)
✅ Validación de DTOs con class-validator
✅ Rate limiting recomendado para producción

## 🔄 Próximos Pasos

1. Implementar refresh tokens
2. Agregar 2FA (autenticación de dos factores)
3. Implementar logout con blacklist de tokens
4. Agregar rate limiting
5. Implementar logs de auditoría
6. Agregar notificaciones de login sospechoso

---

**Creado con ❤️ para CiviGest**
