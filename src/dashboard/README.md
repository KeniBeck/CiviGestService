# Módulo de Dashboard

## Descripción
Módulo centralizado para obtener métricas y estadísticas del sistema CiviGest con **control multi-tenant inteligente**. Proporciona datos adaptados según el rol del usuario (Super Admin, Admin Estatal, Admin Municipal) en 3 endpoints optimizados para diferentes tipos de visualizaciones.

## Características Principales

### 🎯 Control Multi-Tenant Inteligente
- ✅ **Super Administrador**: Ve métricas globales de todas las sedes y subsedes
- ✅ **Administrador Estatal**: Ve métricas de su sede completa
- ✅ **Administrador Municipal**: Ve métricas solo de su municipio
- ✅ **Filtros Opcionales**: Super Admin puede filtrar por sede/subsede específica

### 📊 3 Endpoints Optimizados
- ✅ **Métricas Principales** (`/dashboard/metrics`): KPIs y cards
- ✅ **Tendencias** (`/dashboard/trends`): Datos para gráficos de líneas
- ✅ **Distribuciones** (`/dashboard/distributions`): Datos para gráficos circulares/barras

### 🔒 Seguridad
- ✅ Autenticación JWT obligatoria
- ✅ Control de permisos RBAC
- ✅ Validación de acceso multi-tenant
- ✅ Solo accesible para roles administrativos

## 📡 Endpoints

### 1. Métricas Principales (Cards/KPIs)

```http
GET /dashboard/metrics
Authorization: Bearer {token}
```

**Query Parameters (Opcionales):**
- `fechaInicio`: Fecha de inicio (ISO 8601)
- `fechaFin`: Fecha de fin (ISO 8601)
- `sedeId`: Filtrar por sede (solo Super Admin)
- `subsedeId`: Filtrar por subsede (Super Admin y Admin Estatal)

**Respuesta para Super Administrador:**
```json
{
  "organizacion": {
    "totalSedes": 5,
    "totalSubsedes": 25,
    "totalUsuarios": 150
  },
  "infracciones": {
    "total": 1250,
    "pagadas": 800,
    "pendientes": 450
  },
  "permisos": {
    "total": 350,
    "aprobados": 280,
    "pendientes": 70
  },
  "finanzas": {
    "totalPagosInfracciones": 800,
    "totalPagosPermisos": 280,
    "montoInfracciones": 1200000.00,
    "montoPermisos": 560000.00,
    "montoTotal": 1760000.00
  }
}
```

**Respuesta para Administrador Estatal:**
```json
{
  "organizacion": {
    "totalMunicipios": 8,
    "totalUsuarios": 45
  },
  "infracciones": {
    "total": 380,
    "pagadas": 250,
    "pendientes": 130
  },
  "permisos": {
    "total": 120,
    "aprobados": 95,
    "pendientes": 25
  },
  "finanzas": {
    "montoInfracciones": 380000.00,
    "montoPermisos": 180000.00,
    "montoTotal": 560000.00
  }
}
```

**Respuesta para Administrador Municipal:**
```json
{
  "organizacion": {
    "totalUsuarios": 12
  },
  "infracciones": {
    "total": 85,
    "pagadas": 60,
    "pendientes": 20,
    "vencidas": 5
  },
  "permisos": {
    "total": 35,
    "aprobados": 28,
    "pendientes": 5,
    "enRevision": 2
  },
  "finanzas": {
    "montoInfracciones": 90000.00,
    "montoPermisos": 52500.00,
    "montoTotal": 142500.00
  }
}
```

---

### 2. Datos de Tendencias (Gráficos de Líneas)

```http
GET /dashboard/trends
Authorization: Bearer {token}
```

**Query Parameters (Opcionales):**
- `fechaInicio`: Fecha de inicio (por defecto: hace 12 meses)
- `fechaFin`: Fecha de fin (por defecto: hoy)
- `sedeId`: Filtrar por sede (solo Super Admin)
- `subsedeId`: Filtrar por subsede (Super Admin y Admin Estatal)

**Respuesta:**
```json
{
  "infracciones": [
    { "mes": "2024-01", "cantidad": 45 },
    { "mes": "2024-02", "cantidad": 52 },
    { "mes": "2024-03", "cantidad": 48 },
    { "mes": "2024-04", "cantidad": 55 },
    { "mes": "2024-05", "cantidad": 60 }
  ],
  "pagos": {
    "infracciones": [
      { "mes": "2024-01", "cantidad": 30, "monto": 45000.00 },
      { "mes": "2024-02", "cantidad": 35, "monto": 52500.00 },
      { "mes": "2024-03", "cantidad": 32, "monto": 48000.00 }
    ],
    "permisos": [
      { "mes": "2024-01", "cantidad": 15, "monto": 22500.00 },
      { "mes": "2024-02", "cantidad": 18, "monto": 27000.00 },
      { "mes": "2024-03", "cantidad": 16, "monto": 24000.00 }
    ]
  },
  "permisos": [
    { "mes": "2024-01", "cantidad": 20 },
    { "mes": "2024-02", "cantidad": 25 },
    { "mes": "2024-03", "cantidad": 22 }
  ]
}
```

**Uso en Frontend:**
- Ideal para **gráficos de líneas**
- Muestra evolución temporal
- Datos agrupados por mes
- Incluye cantidades y montos

---

### 3. Distribuciones (Gráficos Circulares/Barras)

```http
GET /dashboard/distributions
Authorization: Bearer {token}
```

**Query Parameters (Opcionales):**
- `fechaInicio`: Fecha de inicio
- `fechaFin`: Fecha de fin
- `sedeId`: Filtrar por sede (solo Super Admin)
- `subsedeId`: Filtrar por subsede (Super Admin y Admin Estatal)

**Respuesta:**
```json
{
  "infraccionesPorTipo": [
    { "tipo": "Exceso de velocidad", "codigo": "TRA-001", "cantidad": 350 },
    { "tipo": "Estacionamiento indebido", "codigo": "TRA-002", "cantidad": 280 },
    { "tipo": "Falta de documentos", "codigo": "TRA-003", "cantidad": 180 },
    { "tipo": "Semáforo en rojo", "codigo": "TRA-004", "cantidad": 150 }
  ],
  "pagosPorMetodo": [
    { "metodo": "EFECTIVO", "cantidad": 450, "monto": 675000.00 },
    { "metodo": "TARJETA_DEBITO", "cantidad": 250, "monto": 375000.00 },
    { "metodo": "TRANSFERENCIA", "cantidad": 180, "monto": 270000.00 },
    { "metodo": "TARJETA_CREDITO", "cantidad": 120, "monto": 180000.00 }
  ],
  "permisosPorEstado": [
    { "estatus": "APROBADO", "cantidad": 180 },
    { "estatus": "SOLICITADO", "cantidad": 45 },
    { "estatus": "EN_REVISION", "cantidad": 30 },
    { "estatus": "RECHAZADO", "cantidad": 15 }
  ],
  "topMunicipios": [
    {
      "municipio": "Guadalajara",
      "codigo": "GDL",
      "infracciones": 450,
      "permisos": 180,
      "ingresos": 675000.00
    },
    {
      "municipio": "Zapopan",
      "codigo": "ZAP",
      "infracciones": 380,
      "permisos": 150,
      "ingresos": 570000.00
    },
    {
      "municipio": "Tlaquepaque",
      "codigo": "TLQ",
      "infracciones": 320,
      "permisos": 120,
      "ingresos": 480000.00
    }
  ]
}
```

**Nota:** `topMunicipios` solo aparece para Super Admin y Admin Estatal.

**Uso en Frontend:**
- Ideal para **gráficos circulares (pie/donut)**
- Ideal para **gráficos de barras**
- Muestra distribuciones y comparativas
- Rankings de municipios

---

## 🎨 Diferencias por Rol

### Super Administrador

**Métricas Principales:**
- Total de sedes (estados)
- Total de subsedes (municipios)
- Total de usuarios
- Totales globales de infracciones y permisos
- Montos totales de ingresos

**Características Especiales:**
- Puede filtrar por cualquier sede o subsede
- Ve el campo `topMunicipios` en distribuciones
- Acceso a toda la información del sistema

---

### Administrador Estatal

**Métricas Principales:**
- Total de municipios en su sede
- Total de usuarios de su sede
- Totales de infracciones y permisos de su sede
- Montos de ingresos de su sede

**Características Especiales:**
- Puede filtrar por subsede dentro de su sede
- Ve el campo `topMunicipios` de su sede
- Solo ve información de su estado

---

### Administrador Municipal

**Métricas Principales:**
- Total de usuarios de su municipio
- Totales de infracciones y permisos de su municipio
- Montos de ingresos de su municipio
- Infracciones vencidas (extra)
- Permisos en revisión (extra)

**Características Especiales:**
- No puede filtrar por otras subsedes
- No ve el campo `topMunicipios`
- Solo ve información de su municipio
- Métricas más detalladas de estado

---

## 🔄 Flujo de Uso Recomendado

### Carga Inicial del Dashboard

```javascript
// 1. Cargar métricas principales (Cards/KPIs)
const metrics = await fetch('/dashboard/metrics');

// 2. Cargar tendencias (últimos 12 meses)
const trends = await fetch('/dashboard/trends');

// 3. Cargar distribuciones
const distributions = await fetch('/dashboard/distributions');
```

### Actualización con Filtros

```javascript
// Filtrar por rango de fechas
const params = new URLSearchParams({
  fechaInicio: '2024-01-01T00:00:00.000Z',
  fechaFin: '2024-12-31T23:59:59.999Z'
});

// Actualizar los 3 endpoints con los mismos filtros
await Promise.all([
  fetch(`/dashboard/metrics?${params}`),
  fetch(`/dashboard/trends?${params}`),
  fetch(`/dashboard/distributions?${params}`)
]);
```

### Filtrado por Sede/Subsede (Super Admin)

```javascript
// Super Admin filtrando por una sede específica
const params = new URLSearchParams({ sedeId: 3 });
await fetch(`/dashboard/metrics?${params}`);

// Super Admin filtrando por un municipio específico
const params2 = new URLSearchParams({ subsedeId: 15 });
await fetch(`/dashboard/metrics?${params2}`);
```

---

## 🏗️ Arquitectura

```
src/dashboard/
├── dto/
│   └── dashboard-filters.dto.ts          # Filtros comunes
├── services/
│   └── dashboard.service.ts              # Lógica de negocio y queries
├── dashboard.controller.ts               # 3 endpoints REST
└── dashboard.module.ts                   # Módulo NestJS
```

---

## 🎯 Optimizaciones Implementadas

### 1. **Queries Eficientes**
- Uso de `Promise.all()` para paralelizar queries
- Agregaciones optimizadas con Prisma
- Índices en campos de fecha para mejor rendimiento

### 2. **Respuestas Adaptadas**
- Estructura de respuesta diferente según el rol
- Solo se calculan métricas relevantes para cada rol
- Campos opcionales según permisos

### 3. **Agrupación Inteligente**
- Datos mensuales para tendencias
- Agrupaciones por tipo, método, estado
- Top rankings pre-calculados

---

## 📊 Casos de Uso por Visualización

### Cards/KPIs (Métricas Principales)
```javascript
// Ejemplo de uso en React
const { organizacion, infracciones, permisos, finanzas } = metrics;

<Card title="Total Usuarios">
  <h2>{organizacion.totalUsuarios}</h2>
</Card>

<Card title="Infracciones Pendientes">
  <h2>{infracciones.pendientes}</h2>
</Card>

<Card title="Ingresos Totales">
  <h2>${finanzas.montoTotal.toLocaleString()}</h2>
</Card>
```

### Gráfico de Líneas (Tendencias)
```javascript
// Ejemplo con Chart.js
const chartData = {
  labels: trends.infracciones.map(item => item.mes),
  datasets: [
    {
      label: 'Infracciones',
      data: trends.infracciones.map(item => item.cantidad),
      borderColor: 'rgb(255, 99, 132)',
    },
    {
      label: 'Permisos',
      data: trends.permisos.map(item => item.cantidad),
      borderColor: 'rgb(54, 162, 235)',
    }
  ]
};
```

### Gráfico Circular (Distribuciones)
```javascript
// Ejemplo con Chart.js
const pieData = {
  labels: distributions.pagosPorMetodo.map(item => item.metodo),
  datasets: [{
    data: distributions.pagosPorMetodo.map(item => item.cantidad),
    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
  }]
};
```

### Tabla de Rankings (Top Municipios)
```javascript
// Ejemplo de tabla
<Table>
  {distributions.topMunicipios?.map(municipio => (
    <TableRow key={municipio.codigo}>
      <TableCell>{municipio.municipio}</TableCell>
      <TableCell>{municipio.infracciones}</TableCell>
      <TableCell>{municipio.permisos}</TableCell>
      <TableCell>${municipio.ingresos.toLocaleString()}</TableCell>
    </TableRow>
  ))}
</Table>
```

---

## 🔑 Permisos Requeridos

| Endpoint | Permiso | Roles Permitidos |
|----------|---------|------------------|
| GET /dashboard/metrics | `dashboard:read` | Super Admin, Admin Estatal, Admin Municipal |
| GET /dashboard/trends | `dashboard:read` | Super Admin, Admin Estatal, Admin Municipal |
| GET /dashboard/distributions | `dashboard:read` | Super Admin, Admin Estatal, Admin Municipal |

---

## ✅ Testing

```bash
# Obtener métricas principales
curl -X GET http://localhost:3000/dashboard/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Obtener tendencias con filtro de fechas
curl -X GET "http://localhost:3000/dashboard/trends?fechaInicio=2024-01-01T00:00:00.000Z&fechaFin=2024-12-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Obtener distribuciones
curl -X GET http://localhost:3000/dashboard/distributions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📝 Notas Importantes

1. **Rendimiento**: Los 3 endpoints están optimizados para carga rápida
2. **Multi-tenant**: Toda la data es filtrada automáticamente según el tenant del usuario
3. **Fechas por Defecto**: Si no se especifican fechas, se usan los últimos 12 meses
4. **Cache**: Se recomienda implementar cache en frontend para evitar llamadas excesivas
5. **Actualización**: Refrescar cada 5-10 minutos es suficiente para la mayoría de casos

---

## 🚀 Próximas Mejoras

- [ ] Comparativa con periodo anterior (%) en métricas
- [ ] Export de datos a CSV/Excel
- [ ] Alertas cuando hay anomalías en las métricas
- [ ] Dashboard personalizable (widgets)
- [ ] Métricas de rendimiento de agentes

---

**Desarrollado con ❤️ para el sistema CiviGest**
