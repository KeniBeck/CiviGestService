# 📋 Módulo de Pagos de Permisos - CiviGest

## 🎯 Descripción

Módulo completo para la gestión de pagos de permisos ciudadanos con:
- ✅ Registro de pagos con descuentos autorizados
- ✅ Cálculos automáticos de costos
- ✅ Generación de códigos QR
- ✅ **Enlaces públicos temporales** para compartir comprobantes
- ✅ Gestión de reembolsos
- ✅ Filtrado multi-tenant con paginación
- ✅ Auditoría completa

## 🏗️ Arquitectura

El módulo sigue el patrón de arquitectura profesional del proyecto:

```
src/pagos-permisos/
├── pagos-permisos.module.ts           # Configuración del módulo
├── pagos-permisos.controller.ts       # Endpoints REST
│
├── services/
│   ├── pagos-permisos.service.ts      # Lógica CRUD (create, update, remove, reembolso)
│   └── pagos-permisos-finder.service.ts # Consultas (findAll, findOne, statistics)
│
├── dto/
│   ├── create-pago-permiso.dto.ts     # Validación para crear pagos
│   ├── update-pago-permiso.dto.ts     # Validación para actualizar
│   ├── filter-pagos-permisos.dto.ts   # Filtros con paginación
│   └── create-reembolso.dto.ts        # Validación para reembolsos
│
└── utils/
    └── qr-generator.util.ts           # Generación de códigos QR
```

## 🔄 Flujo de Compartir por WhatsApp

### Backend (✅ IMPLEMENTADO):
1. Cajero registra pago → Guarda datos + QR
2. Frontend llama `POST /pagos-permisos/:id/generar-enlace-publico`
3. Backend responde con enlace temporal (expira en 72 horas)

### Frontend (📝 POR IMPLEMENTAR):
1. Frontend genera PDF con `jsPDF` usando los datos del pago
2. Usuario hace clic en "Compartir por WhatsApp"
3. Frontend usa **Web Share API** (móvil) o `wa.me` (PC)
4. Ciudadano abre enlace → Frontend llama `GET /pagos-permisos/publico/:token`
5. Frontend genera PDF y permite descargar/imprimir

**Ventajas:**
- 🆓 100% Gratis (sin APIs de pago)
- ⚡ Rápido (sin generar PDFs en servidor)
- 💾 Sin almacenamiento (PDFs no se guardan)
- 🔒 Seguro (tokens únicos con expiración)

---

## 📡 Endpoints Principales

### 1. Crear Pago
```http
POST /pagos-permisos
Authorization: Bearer {token}
```

### 2. Listar Pagos (paginado)
```http
GET /pagos-permisos?page=1&limit=10&search=Juan&estatus=PAGADO
Authorization: Bearer {token}
```

### 3. Generar Enlace Público ✨
```http
POST /pagos-permisos/:id/generar-enlace-publico
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "enlacePublico": "http://localhost:5173/comprobantes/abc123...",
  "expiraEn": "2024-12-12T10:30:00Z"
}
```

### 4. Ver Comprobante Público ✨ (SIN AUTENTICACIÓN)
```http
GET /pagos-permisos/publico/:token
```

---

## 🚀 Instalación

### 1. Variables de Entorno
```env
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"
```

### 2. Migración
```bash
npx prisma migrate dev --name add-token-publico-pagos-permisos
npx prisma generate
```

### 3. Dependencias
- ✅ `qrcode` (para códigos QR)
- ❌ NO requiere: pdf-lib, twilio, resend

---

## 📝 Documentación Completa

Ver archivo completo con todos los endpoints, validaciones y ejemplos.

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2024
