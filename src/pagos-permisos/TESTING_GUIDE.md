# Guía de Testing - Enlaces Públicos de Comprobantes

## 🧪 Testing Manual con cURL/Postman

### 1️⃣ Autenticación

Primero, obtén un token de autenticación:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Guarda el `access_token` de la respuesta.

---

### 2️⃣ Generar Enlace Público

**Endpoint:** `POST /pagos-permisos/:id/generar-enlace-publico`

**Requiere:** Autenticación (Bearer Token)

**Roles permitidos:** Super Administrador, Administrador Estatal, Municipal, Operativo

```bash
curl -X POST http://localhost:3000/pagos-permisos/1/generar-enlace-publico \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Respuesta esperada:**

```json
{
  "enlacePublico": "http://localhost:5173/comprobantes/a1b2c3d4e5f6...",
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
  "expiraEn": "2025-12-12T10:30:00.000Z"
}
```

**Códigos de respuesta:**
- `201`: Enlace generado correctamente
- `401`: No autenticado
- `403`: Sin permisos
- `404`: Pago no encontrado

---

### 3️⃣ Obtener Comprobante Público

**Endpoint:** `GET /pagos-permisos/publico/:token`

**Requiere:** ❌ Sin autenticación (público)

```bash
curl -X GET http://localhost:3000/pagos-permisos/publico/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
```

**Respuesta esperada:**

```json
{
  "id": 1,
  "numeroRecibo": "REC-2025-001",
  "monto": 150.00,
  "fechaPago": "2025-12-09T08:30:00.000Z",
  "metodoPago": "EFECTIVO",
  "estadoPago": "COMPLETADO",
  "observaciones": "Pago de permiso comercial",
  "codigoQR": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "createdAt": "2025-12-09T08:30:00.000Z",
  "updatedAt": "2025-12-09T08:30:00.000Z",
  "permiso": {
    "id": 1,
    "numeroPermiso": "PERM-2025-001",
    "tipoPermiso": {
      "nombre": "Permiso Comercial",
      "descripcion": "Permiso para actividades comerciales"
    },
    "ciudadano": {
      "nombre": "Juan",
      "apellidoPaterno": "Pérez",
      "apellidoMaterno": "García",
      "curp": "PEGJ900101HDFRNN01",
      "rfc": "PEGJ900101ABC"
    }
  },
  "usuarioRegistro": {
    "id": 1,
    "nombre": "María López",
    "email": "maria.lopez@example.com"
  }
}
```

**Códigos de respuesta:**
- `200`: Comprobante encontrado
- `404`: Token inválido o expirado

---

## 🔄 Flujo Completo de Prueba

### Escenario 1: Flujo exitoso

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | jq -r '.access_token')

# 2. Generar enlace público
ENLACE=$(curl -X POST http://localhost:3000/pagos-permisos/1/generar-enlace-publico \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.token')

# 3. Obtener comprobante (sin autenticación)
curl -X GET http://localhost:3000/pagos-permisos/publico/$ENLACE | jq

# 4. Simular ciudadano compartiendo por WhatsApp
echo "Enlace para compartir: http://localhost:5173/comprobantes/$ENLACE"
```

### Escenario 2: Token expirado

```bash
# El token expira después de 72 horas
# Para simular, puedes modificar manualmente la fecha en la BD:

# SQL para expirar un token:
UPDATE "PagoPermiso" 
SET "tokenExpiraEn" = NOW() - INTERVAL '1 hour' 
WHERE id = 1;

# Luego intentar acceder:
curl -X GET http://localhost:3000/pagos-permisos/publico/$TOKEN_EXPIRADO
# Esperado: 404 - Token expirado o inválido
```

### Escenario 3: Token inválido

```bash
curl -X GET http://localhost:3000/pagos-permisos/publico/token-falso-123
# Esperado: 404 - Token no existe
```

---

## 🧪 Testing Automatizado

### Ejecutar tests E2E

```bash
npm run test:e2e src/pagos-permisos/test/pagos-permisos-enlace-publico.e2e-spec.ts
```

### Ejecutar todos los tests del módulo

```bash
npm run test pagos-permisos
```

---

## 📊 Validaciones Importantes

### ✅ Checklist de Testing

- [ ] **Generación de enlace requiere autenticación**
- [ ] **Acceso público NO requiere autenticación**
- [ ] **Token tiene 64 caracteres hexadecimales**
- [ ] **Token expira en exactamente 72 horas**
- [ ] **Tokens son únicos (no se repiten)**
- [ ] **Token expirado retorna 404**
- [ ] **Token inválido retorna 404**
- [ ] **Respuesta incluye datos completos del pago**
- [ ] **Respuesta incluye relaciones (permiso, ciudadano, usuario)**
- [ ] **Respuesta incluye código QR en base64**
- [ ] **Respuesta NO expone tokenPublico ni tokenExpiraEn**

---

## 🔍 Debug y Troubleshooting

### Ver tokens en la base de datos

```sql
SELECT 
  id, 
  "numeroRecibo",
  "tokenPublico",
  "tokenExpiraEn",
  "tokenExpiraEn" > NOW() as "tokenValido"
FROM "PagoPermiso"
WHERE "tokenPublico" IS NOT NULL;
```

### Limpiar tokens expirados

```sql
UPDATE "PagoPermiso"
SET "tokenPublico" = NULL, "tokenExpiraEn" = NULL
WHERE "tokenExpiraEn" < NOW();
```

### Ver logs del servidor

```bash
# En modo desarrollo con logs detallados
npm run start:dev

# En producción
pm2 logs civigest
```

---

## 🌐 Testing desde Frontend

### Ejemplo con fetch (JavaScript)

```javascript
// 1. Generar enlace (requiere autenticación)
const generarEnlace = async (pagoId) => {
  const response = await fetch(
    `http://localhost:3000/pagos-permisos/${pagoId}/generar-enlace-publico`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }
  );
  return await response.json();
};

// 2. Obtener comprobante público (sin autenticación)
const obtenerComprobante = async (token) => {
  const response = await fetch(
    `http://localhost:3000/pagos-permisos/publico/${token}`
  );
  return await response.json();
};

// 3. Compartir por WhatsApp
const compartirWhatsApp = (enlacePublico) => {
  const mensaje = encodeURIComponent(
    `¡Hola! Aquí está tu comprobante de pago: ${enlacePublico}`
  );
  
  // Móvil: usar Web Share API
  if (navigator.share) {
    navigator.share({
      title: 'Comprobante de Pago',
      text: '¡Hola! Aquí está tu comprobante de pago',
      url: enlacePublico
    });
  } else {
    // PC: abrir WhatsApp Web
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  }
};
```

---

## 📱 Testing en Dispositivos Móviles

### 1. Usar ngrok para exponer localhost

```bash
# Instalar ngrok
brew install ngrok  # macOS
# o descargar desde https://ngrok.com/

# Exponer puerto 3000
ngrok http 3000
```

### 2. Actualizar FRONTEND_URL y BACKEND_URL en .env

```env
FRONTEND_URL="https://abc123.ngrok.io"
BACKEND_URL="https://def456.ngrok.io"
```

### 3. Probar Web Share API en móvil

Abre la página del comprobante en tu móvil y verifica que el botón "Compartir" use la API nativa del sistema operativo.

---

## 🚀 Performance Testing

### Generar múltiples enlaces

```bash
# Script para generar 100 enlaces
for i in {1..100}; do
  curl -X POST http://localhost:3000/pagos-permisos/1/generar-enlace-publico \
    -H "Authorization: Bearer $TOKEN" &
done
wait

echo "✅ 100 enlaces generados"
```

### Verificar velocidad de respuesta

```bash
time curl -X GET http://localhost:3000/pagos-permisos/publico/$TOKEN
```

**Expectativa:** Respuesta en < 100ms

---

## 📋 Notas Adicionales

- Los tokens tienen **64 caracteres** (256 bits de entropía)
- La expiración es de **72 horas** (3 días)
- Un mismo pago puede tener **múltiples enlaces** activos
- Los enlaces **no son revocables** (solo expiran)
- No hay límite de accesos por enlace
- El endpoint público **no registra métricas** de acceso (privacidad)
