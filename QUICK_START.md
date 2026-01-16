# 🚀 Quick Start - Enlaces Públicos de Comprobantes

## TL;DR

Sistema implementado para compartir comprobantes de pago por WhatsApp sin APIs de pago ni generación de PDFs en backend.

---

## ✅ Backend: LISTO PARA USAR

### Lo que ya funciona:

1. ✅ **Base de datos actualizada** con campos `tokenPublico` y `tokenExpiraEn`
2. ✅ **Endpoint para generar enlaces**: `POST /pagos-permisos/:id/generar-enlace-publico`
3. ✅ **Endpoint público**: `GET /pagos-permisos/publico/:token` (sin autenticación)
4. ✅ **Tokens seguros** de 64 caracteres con expiración de 72 horas
5. ✅ **Sin errores de compilación**

---

## 🧪 Prueba Rápida (5 minutos)

### 1. Inicia el servidor

```bash
cd /home/andresdev/utils/repos/CiviGest/CiviGestService
npm run start:dev
```

### 2. Obtén un token de autenticación

```bash
# Ajusta las credenciales según tu base de datos
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu-email@example.com","password":"tu-password"}' \
  | jq -r '.access_token'
```

Guarda el token que te devuelve.

### 3. Genera un enlace público

```bash
# Reemplaza YOUR_TOKEN con el token del paso anterior
# Reemplaza 1 con el ID de un pago existente
curl -X POST http://localhost:3000/pagos-permisos/1/generar-enlace-publico \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq
```

**Respuesta esperada**:
```json
{
  "enlacePublico": "http://localhost:5173/comprobantes/abc123def456...",
  "token": "abc123def456ghi789...",
  "expiraEn": "2025-12-12T10:30:00.000Z"
}
```

### 4. Accede al comprobante (SIN autenticación)

```bash
# Reemplaza TOKEN con el token del paso anterior
curl -X GET http://localhost:3000/pagos-permisos/publico/TOKEN | jq
```

**Respuesta esperada**: Datos completos del comprobante con relaciones.

---

## 📱 ¿Qué sigue? Implementar Frontend

### Instalación (1 minuto)

```bash
cd /home/andresdev/utils/repos/CiviGest/CiviGestFrontend  # Ajusta la ruta
npm install jspdf jspdf-autotable
```

### Archivos a crear:

Sigue la guía completa en: **`src/pagos-permisos/FRONTEND_GUIDE.md`**

Archivos principales:
1. `services/pagosPermisosService.ts` - Llamadas a la API
2. `utils/pdfGenerator.ts` - Generación de PDF con jsPDF
3. `utils/whatsappShare.ts` - Web Share API
4. `components/ShareButton.tsx` - Botón de compartir
5. `pages/comprobantes/[token].tsx` - Página pública

### Tiempo estimado de implementación:
- **Básico** (sin estilos): 1-2 horas
- **Completo** (con diseño): 3-4 horas

---

## 📋 Endpoints Disponibles

### 1. Generar Enlace Público
```
POST /pagos-permisos/:id/generar-enlace-publico
```
- ✅ **Requiere autenticación** (JWT Bearer Token)
- **Roles**: Super Admin, Admin Estatal, Municipal, Operativo
- **Response**: `{ enlacePublico, token, expiraEn }`

### 2. Obtener Comprobante Público
```
GET /pagos-permisos/publico/:token
```
- ❌ **Sin autenticación** (endpoint público)
- **Roles**: Cualquiera (ciudadanos)
- **Response**: Datos completos del comprobante

---

## 🔍 Troubleshooting

### Error: "Token expirado o inválido"
- Los tokens expiran después de 72 horas
- Genera un nuevo enlace con el endpoint POST

### Error: "No se pudo generar el enlace"
- Verifica que el pago existe
- Verifica que tienes permisos de autenticación
- Revisa los logs del servidor

### Error al compilar
```bash
# Regenera Prisma Client
npx prisma generate

# Rebuild
npm run build
```

---

## 📚 Documentación Completa

1. **Guía de Testing**: `src/pagos-permisos/TESTING_GUIDE.md`
2. **Guía de Frontend**: `src/pagos-permisos/FRONTEND_GUIDE.md`
3. **Implementación Completa**: `IMPLEMENTACION_ENLACES_PUBLICOS.md`
4. **README del Módulo**: `src/pagos-permisos/README.md`

---

## 🎯 Casos de Uso

### Caso 1: Cajero comparte comprobante con ciudadano

```
1. Cajero registra pago en sistema
2. Sistema muestra botón "Compartir por WhatsApp"
3. Cajero hace clic → se genera enlace temporal
4. Cajero comparte enlace por WhatsApp
5. Ciudadano abre enlace → ve comprobante
6. Ciudadano descarga PDF o imprime
```

### Caso 2: Ciudadano solicita reenvío

```
1. Ciudadano contacta oficina
2. Operador busca pago en sistema
3. Operador genera nuevo enlace
4. Operador envía por WhatsApp, email o SMS
5. Ciudadano accede al comprobante
```

---

## 💡 Consejos Pro

### 1. Testing rápido con Postman
Importa esta colección:
```json
{
  "info": { "name": "CiviGest - Enlaces Públicos" },
  "item": [
    {
      "name": "Generar Enlace",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/pagos-permisos/:id/generar-enlace-publico",
        "auth": { "type": "bearer", "bearer": [{"key": "token", "value": "{{token}}"}] }
      }
    },
    {
      "name": "Ver Comprobante Público",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/pagos-permisos/publico/:token"
      }
    }
  ]
}
```

### 2. Debug mode
Activa logs detallados:
```bash
DEBUG=* npm run start:dev
```

### 3. Ver tokens en base de datos
```sql
SELECT 
  id,
  "numeroRecibo",
  "tokenPublico",
  "tokenExpiraEn",
  CASE WHEN "tokenExpiraEn" > NOW() THEN '✅ Válido' ELSE '❌ Expirado' END as estado
FROM "PagoPermiso"
WHERE "tokenPublico" IS NOT NULL
ORDER BY "tokenExpiraEn" DESC;
```

---

## 🚨 Importante

### En Producción:

1. **Configura CORS** correctamente en `main.ts`
2. **Usa HTTPS** siempre (Let's Encrypt gratis)
3. **Rate Limiting** en endpoint público (evitar abuse)
4. **Monitoreo** de tokens generados
5. **Backups** regulares de la base de datos

### Variables de Entorno:

```env
# Desarrollo
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"

# Producción
FRONTEND_URL="https://civigest.com"
BACKEND_URL="https://api.civigest.com"
```

---

## ✅ Estado Actual

| Componente | Estado | Descripción |
|------------|--------|-------------|
| Schema Prisma | ✅ Completo | Campos agregados y migrados |
| Backend Service | ✅ Completo | Lógica implementada |
| Backend Controller | ✅ Completo | Endpoints funcionando |
| Documentación | ✅ Completa | Guías detalladas |
| Tests E2E | ✅ Creados | Listos para ejecutar |
| Frontend | 📝 Pendiente | Guía disponible |

---

## 📞 Ayuda

¿Problemas? Revisa en orden:

1. **Logs del servidor**: `npm run start:dev`
2. **Base de datos**: ¿Migración aplicada? `npx prisma migrate status`
3. **Compilación**: `npm run build`
4. **Documentación**: Lee las guías en `src/pagos-permisos/`

---

**¡Todo listo para usar!** 🎉

El backend está 100% funcional. Solo falta implementar el frontend siguiendo la guía en `FRONTEND_GUIDE.md`.
