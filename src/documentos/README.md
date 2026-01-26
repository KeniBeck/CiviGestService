# Módulo de Documentos PDF

Este módulo maneja la subida, almacenamiento y gestión de archivos PDF en el sistema CiviGest.

## Características

- ✅ Subida de archivos PDF individuales
- ✅ Subida de múltiples archivos PDF
- ✅ Descarga de archivos
- ✅ Visualización de archivos en navegador
- ✅ Reemplazo de archivos
- ✅ Eliminación de archivos
- ✅ Validación automática de tipo PDF
- ✅ Límite de tamaño: 10 MB por archivo
- ✅ Nombres de archivo únicos automáticos

## Integración con TipoPermiso

Los documentos PDF se suben cuando en el modelo `TipoPermiso`, en los campos adicionales (`camposPersonalizados`), el `type` sea `"pdf"`.

### Ejemplo de campo personalizado tipo PDF en TipoPermiso:

```json
{
  "camposPersonalizados": [
    {
      "nombre": "plano_construccion",
      "label": "Plano de Construcción",
      "type": "pdf",
      "required": true,
      "descripcion": "Suba el plano arquitectónico del proyecto"
    },
    {
      "nombre": "identificacion_oficial",
      "label": "Identificación Oficial",
      "type": "pdf",
      "required": true,
      "descripcion": "INE o IFE"
    }
  ]
}
```

Cuando un ciudadano solicite un permiso de este tipo, deberá subir los PDFs correspondientes, y las rutas se guardarán en el campo `camposAdicionales` del modelo `Permiso`:

```json
{
  "camposAdicionales": {
    "plano_construccion": "images/documentos/file-1234567890-123456789.pdf",
    "identificacion_oficial": "images/documentos/file-1234567891-987654321.pdf"
  }
}
```

## Endpoints API

### 1. Subir un archivo PDF

**POST** `/documentos/upload`

**Content-Type:** `multipart/form-data`

**Body:**
- `file`: Archivo PDF (requerido)

**Respuesta:**
```json
{
  "nombreArchivo": "documento.pdf",
  "rutaArchivo": "images/documentos/file-1234567890-123456789.pdf",
  "tamanoBytes": 1048576,
  "mimeType": "application/pdf"
}
```

### 2. Subir múltiples archivos PDF

**POST** `/documentos/upload-multiple`

**Content-Type:** `multipart/form-data`

**Body:**
- `files`: Array de archivos PDF (máximo 10)

**Respuesta:**
```json
[
  {
    "nombreArchivo": "documento1.pdf",
    "rutaArchivo": "images/documentos/file-1234567890-123456789.pdf",
    "tamanoBytes": 1048576,
    "mimeType": "application/pdf"
  },
  {
    "nombreArchivo": "documento2.pdf",
    "rutaArchivo": "images/documentos/file-1234567891-987654321.pdf",
    "tamanoBytes": 2097152,
    "mimeType": "application/pdf"
  }
]
```

### 3. Descargar un archivo

**GET** `/documentos/download/:filename`

**Parámetros:**
- `filename`: Nombre del archivo (ej: `file-1234567890-123456789.pdf`)

**Respuesta:** Stream del archivo PDF para descarga

### 4. Ver un archivo en el navegador

**GET** `/documentos/view/:filename`

**Parámetros:**
- `filename`: Nombre del archivo

**Respuesta:** Stream del archivo PDF para visualización inline

### 5. Reemplazar un archivo

**POST** `/documentos/replace/:filename`

**Content-Type:** `multipart/form-data`

**Parámetros:**
- `filename`: Nombre del archivo a reemplazar

**Body:**
- `file`: Nuevo archivo PDF

**Respuesta:**
```json
{
  "nombreArchivo": "nuevo_documento.pdf",
  "rutaArchivo": "images/documentos/file-9876543210-987654321.pdf",
  "tamanoBytes": 1234567,
  "mimeType": "application/pdf"
}
```

### 6. Eliminar un archivo

**DELETE** `/documentos/:filename`

**Parámetros:**
- `filename`: Nombre del archivo a eliminar

**Respuesta:**
```json
{
  "message": "Archivo eliminado exitosamente"
}
```

### 7. Obtener información de un archivo

**GET** `/documentos/info/:filename`

**Parámetros:**
- `filename`: Nombre del archivo

**Respuesta:**
```json
{
  "exists": true,
  "size": 1048576,
  "path": "./images/documentos/file-1234567890-123456789.pdf"
}
```

## Uso desde el Frontend

### Ejemplo con Fetch API:

```javascript
// Subir un archivo
async function uploadPDF(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3000/documentos/upload', {
    method: 'POST',
    body: formData,
  });

  return await response.json();
}

// Subir múltiples archivos
async function uploadMultiplePDFs(files) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch('http://localhost:3000/documentos/upload-multiple', {
    method: 'POST',
    body: formData,
  });

  return await response.json();
}

// Ver archivo en nueva ventana
function viewPDF(filename) {
  window.open(`http://localhost:3000/documentos/view/${filename}`, '_blank');
}

// Descargar archivo
function downloadPDF(filename) {
  window.location.href = `http://localhost:3000/documentos/download/${filename}`;
}
```

### Ejemplo con Axios:

```javascript
import axios from 'axios';

// Subir un archivo
async function uploadPDF(file) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axios.post(
    'http://localhost:3000/documentos/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return data;
}
```

## Configuración

Las rutas de almacenamiento se configuran en:

**`.env`:**
```env
DOCUMENTS_PATH="~/images/documentos"
```

**`src/config/variables.ts`:**
```typescript
export const DOCUMENTS_PATH = process.env.DOCUMENTS_PATH || '~/images/documentos';
```

## Validaciones

- ✅ Solo archivos PDF permitidos
- ✅ Tamaño máximo: 10 MB por archivo
- ✅ Validación de tipo MIME: `application/pdf`
- ✅ Nombres de archivo únicos (timestamp + random)

## Servicio (DocumentosService)

El servicio puede ser inyectado en otros módulos para usar sus funciones:

```typescript
import { DocumentosService } from './documentos/service/documentos.service';

@Injectable()
export class MiServicio {
  constructor(private readonly documentosService: DocumentosService) {}

  async subirDocumento(file: Express.Multer.File) {
    return this.documentosService.uploadFile(file);
  }

  async eliminarDocumento(rutaArchivo: string) {
    await this.documentosService.deleteFile(rutaArchivo);
  }
}
```

## Estructura de Archivos

```
src/documentos/
├── documentos.controller.ts  # Controlador con endpoints REST
├── documentos.module.ts      # Configuración del módulo
├── service/
│   └── documentos.service.ts # Lógica de negocio
└── dto/
    ├── create-documento.dto.ts
    ├── update-documento.dto.ts
    └── documento-response.dto.ts
```

## Notas Importantes

1. **No se crea tabla en base de datos**: Los archivos solo se almacenan en el sistema de archivos.
2. **Las rutas se guardan en el modelo Permiso**: En el campo `camposAdicionales` (JSON).
3. **Limpieza manual**: Los archivos huérfanos deben limpiarse manualmente o con un cron job.
4. **Backup**: Asegúrese de incluir la carpeta `images/documentos` en sus respaldos.

## Swagger/OpenAPI

Todos los endpoints están documentados en Swagger:

```
http://localhost:3000/api
```
