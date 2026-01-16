# Guía de Implementación Frontend - Enlaces Públicos de Comprobantes

## 🎯 Objetivo

Implementar la generación de PDFs y el sistema de compartir comprobantes por WhatsApp en el frontend de CiviGest.

---

## 📦 Dependencias Necesarias

```bash
# Instalación de dependencias
npm install jspdf jspdf-autotable
```

### Descripción de las librerías:
- **jsPDF**: Generación de documentos PDF en el navegador
- **jspdf-autotable**: Plugin para crear tablas en PDFs

---

## 🗂️ Estructura de Archivos Sugerida

```
src/
├── modules/
│   └── pagos-permisos/
│       ├── components/
│       │   ├── PagosList.tsx
│       │   ├── PagoDetail.tsx
│       │   ├── ComprobantePublico.tsx  ⭐ NUEVO
│       │   └── ShareButton.tsx          ⭐ NUEVO
│       ├── hooks/
│       │   ├── usePagosPermisos.ts
│       │   └── useComprobantePublico.ts ⭐ NUEVO
│       ├── services/
│       │   └── pagosPermisosService.ts
│       └── utils/
│           ├── pdfGenerator.ts          ⭐ NUEVO
│           └── whatsappShare.ts         ⭐ NUEVO
└── pages/
    └── comprobantes/
        └── [token].tsx                   ⭐ NUEVO (página pública)
```

---

## 🔧 Implementación Paso a Paso

### 1️⃣ Servicio de API (`services/pagosPermisosService.ts`)

```typescript
// src/modules/pagos-permisos/services/pagosPermisosService.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface EnlacePublicoResponse {
  enlacePublico: string;
  token: string;
  expiraEn: string;
}

export interface ComprobantePublico {
  id: number;
  numeroRecibo: string;
  monto: number;
  fechaPago: string;
  metodoPago: string;
  estadoPago: string;
  observaciones?: string;
  codigoQR: string;
  permiso: {
    id: number;
    numeroPermiso: string;
    tipoPermiso: {
      nombre: string;
      descripcion: string;
    };
    ciudadano: {
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
      curp: string;
      rfc?: string;
    };
  };
  usuarioRegistro: {
    nombre: string;
    email: string;
  };
}

export const pagosPermisosService = {
  /**
   * Generar enlace público temporal (requiere autenticación)
   */
  async generarEnlacePublico(pagoId: number): Promise<EnlacePublicoResponse> {
    const token = localStorage.getItem('token'); // O tu método de auth
    
    const response = await fetch(
      `${API_URL}/pagos-permisos/${pagoId}/generar-enlace-publico`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error al generar enlace público');
    }

    return await response.json();
  },

  /**
   * Obtener comprobante público (sin autenticación)
   */
  async getComprobantePublico(token: string): Promise<ComprobantePublico> {
    const response = await fetch(
      `${API_URL}/pagos-permisos/publico/${token}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Enlace inválido o expirado');
      }
      throw new Error('Error al obtener comprobante');
    }

    return await response.json();
  },
};
```

---

### 2️⃣ Generador de PDF (`utils/pdfGenerator.ts`)

```typescript
// src/modules/pagos-permisos/utils/pdfGenerator.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComprobantePublico } from '../services/pagosPermisosService';

export const generarComprobantePDF = (comprobante: ComprobantePublico) => {
  const doc = new jsPDF();
  
  // Configuración
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // ========== ENCABEZADO ==========
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROBANTE DE PAGO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión Ciudadana - CiviGest', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // ========== INFORMACIÓN DEL PAGO ==========
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Pago', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const infoPago = [
    ['Número de Recibo:', comprobante.numeroRecibo],
    ['Fecha de Pago:', new Date(comprobante.fechaPago).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })],
    ['Monto:', `$${comprobante.monto.toFixed(2)} MXN`],
    ['Método de Pago:', comprobante.metodoPago],
    ['Estado:', comprobante.estadoPago],
  ];

  if (comprobante.observaciones) {
    infoPago.push(['Observaciones:', comprobante.observaciones]);
  }

  autoTable(doc, {
    startY: yPos,
    body: infoPago,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ========== INFORMACIÓN DEL PERMISO ==========
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Permiso', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const infoPermiso = [
    ['Número de Permiso:', comprobante.permiso.numeroPermiso],
    ['Tipo de Permiso:', comprobante.permiso.tipoPermiso.nombre],
    ['Descripción:', comprobante.permiso.tipoPermiso.descripcion],
  ];

  autoTable(doc, {
    startY: yPos,
    body: infoPermiso,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ========== INFORMACIÓN DEL CIUDADANO ==========
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Ciudadano', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const ciudadano = comprobante.permiso.ciudadano;
  const nombreCompleto = `${ciudadano.nombre} ${ciudadano.apellidoPaterno} ${ciudadano.apellidoMaterno}`;

  const infoCiudadano = [
    ['Nombre:', nombreCompleto],
    ['CURP:', ciudadano.curp],
  ];

  if (ciudadano.rfc) {
    infoCiudadano.push(['RFC:', ciudadano.rfc]);
  }

  autoTable(doc, {
    startY: yPos,
    body: infoCiudadano,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ========== CÓDIGO QR ==========
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Código de Verificación', margin, yPos);
  yPos += 5;

  // Agregar imagen QR (base64)
  const qrSize = 60;
  doc.addImage(comprobante.codigoQR, 'PNG', margin, yPos, qrSize, qrSize);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Escanea este código para verificar', margin + qrSize + 5, yPos + 30);
  doc.text('la autenticidad del comprobante', margin + qrSize + 5, yPos + 35);

  yPos += qrSize + 15;

  // ========== PIE DE PÁGINA ==========
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text(
    'Este documento es un comprobante válido de pago.',
    pageWidth / 2,
    pageHeight - 20,
    { align: 'center' }
  );
  doc.text(
    `Registrado por: ${comprobante.usuarioRegistro.nombre}`,
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );
  doc.text(
    `Generado el: ${new Date().toLocaleString('es-MX')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // ========== GUARDAR PDF ==========
  const nombreArchivo = `Comprobante_${comprobante.numeroRecibo}.pdf`;
  doc.save(nombreArchivo);
};
```

---

### 3️⃣ Compartir por WhatsApp (`utils/whatsappShare.ts`)

```typescript
// src/modules/pagos-permisos/utils/whatsappShare.ts

export interface ShareOptions {
  titulo?: string;
  mensaje?: string;
  url: string;
}

/**
 * Compartir enlace por WhatsApp
 * - Móvil: Usa Web Share API nativa
 * - PC: Abre WhatsApp Web
 */
export const compartirPorWhatsApp = async (options: ShareOptions) => {
  const { titulo = 'Comprobante de Pago', mensaje, url } = options;

  // Intentar usar Web Share API (móviles)
  if (navigator.share) {
    try {
      await navigator.share({
        title: titulo,
        text: mensaje || `¡Hola! Aquí está tu ${titulo}`,
        url: url,
      });
      return { success: true, method: 'native' };
    } catch (error) {
      // Usuario canceló o error
      console.log('Share cancelled or failed:', error);
      return { success: false, method: 'native', error };
    }
  }

  // Fallback: WhatsApp Web (PC)
  const mensajeCompleto = mensaje
    ? `${mensaje}\n\n${url}`
    : `¡Hola! Aquí está tu ${titulo}\n\n${url}`;
  
  const mensajeEncoded = encodeURIComponent(mensajeCompleto);
  const whatsappUrl = `https://wa.me/?text=${mensajeEncoded}`;
  
  window.open(whatsappUrl, '_blank');
  return { success: true, method: 'whatsapp-web' };
};

/**
 * Verificar si el dispositivo soporta Web Share API
 */
export const soportaWebShare = (): boolean => {
  return 'share' in navigator;
};
```

---

### 4️⃣ Hook Personalizado (`hooks/useComprobantePublico.ts`)

```typescript
// src/modules/pagos-permisos/hooks/useComprobantePublico.ts

import { useState, useEffect } from 'react';
import { pagosPermisosService, type ComprobantePublico } from '../services/pagosPermisosService';

export const useComprobantePublico = (token: string) => {
  const [comprobante, setComprobante] = useState<ComprobantePublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComprobante = async () => {
      try {
        setLoading(true);
        const data = await pagosPermisosService.getComprobantePublico(token);
        setComprobante(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setComprobante(null);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchComprobante();
    }
  }, [token]);

  return { comprobante, loading, error };
};
```

---

### 5️⃣ Componente: Botón de Compartir (`components/ShareButton.tsx`)

```typescript
// src/modules/pagos-permisos/components/ShareButton.tsx

import { useState } from 'react';
import { Share2, MessageCircle } from 'lucide-react'; // O tus iconos
import { compartirPorWhatsApp, soportaWebShare } from '../utils/whatsappShare';
import { pagosPermisosService } from '../services/pagosPermisosService';

interface ShareButtonProps {
  pagoId: number;
  numeroRecibo: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ pagoId, numeroRecibo }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esMovil = soportaWebShare();

  const handleShare = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Generar enlace público
      const { enlacePublico } = await pagosPermisosService.generarEnlacePublico(pagoId);

      // 2. Compartir por WhatsApp
      const result = await compartirPorWhatsApp({
        titulo: 'Comprobante de Pago',
        mensaje: `Comprobante de pago ${numeroRecibo}`,
        url: enlacePublico,
      });

      if (!result.success) {
        setError('No se pudo compartir el enlace');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al compartir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleShare}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {esMovil ? (
          <Share2 className="w-5 h-5" />
        ) : (
          <MessageCircle className="w-5 h-5" />
        )}
        {loading ? 'Generando enlace...' : 'Compartir por WhatsApp'}
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

---

### 6️⃣ Página Pública (`pages/comprobantes/[token].tsx`)

```typescript
// src/pages/comprobantes/[token].tsx (Next.js)
// O src/routes/comprobantes/$token.tsx (React Router)

import { useParams } from 'react-router-dom'; // O Next.js
import { Download, Printer, AlertCircle } from 'lucide-react';
import { useComprobantePublico } from '@/modules/pagos-permisos/hooks/useComprobantePublico';
import { generarComprobantePDF } from '@/modules/pagos-permisos/utils/pdfGenerator';

export default function ComprobantePage() {
  const { token } = useParams<{ token: string }>();
  const { comprobante, loading, error } = useComprobantePublico(token!);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !comprobante) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h2 className="font-semibold">Enlace inválido o expirado</h2>
              <p className="text-sm mt-1">{error || 'No se pudo cargar el comprobante'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDescargarPDF = () => {
    generarComprobantePDF(comprobante);
  };

  const handleImprimir = () => {
    window.print();
  };

  const ciudadano = comprobante.permiso.ciudadano;
  const nombreCompleto = `${ciudadano.nombre} ${ciudadano.apellidoPaterno} ${ciudadano.apellidoMaterno}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            Comprobante de Pago
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Sistema de Gestión Ciudadana - CiviGest
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleDescargarPDF}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Descargar PDF
          </button>
          <button
            onClick={handleImprimir}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Imprimir
          </button>
        </div>

        {/* Contenido del comprobante */}
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8 print:shadow-none">
          {/* Información del pago */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información del Pago
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Número de Recibo</dt>
                <dd className="text-lg font-semibold text-gray-900">{comprobante.numeroRecibo}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Pago</dt>
                <dd className="text-lg text-gray-900">
                  {new Date(comprobante.fechaPago).toLocaleString('es-MX')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Monto</dt>
                <dd className="text-lg font-semibold text-green-600">
                  ${comprobante.monto.toFixed(2)} MXN
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Método de Pago</dt>
                <dd className="text-lg text-gray-900">{comprobante.metodoPago}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                <dd>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {comprobante.estadoPago}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          {/* Información del permiso */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información del Permiso
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Número de Permiso</dt>
                <dd className="text-lg text-gray-900">{comprobante.permiso.numeroPermiso}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tipo de Permiso</dt>
                <dd className="text-lg text-gray-900">{comprobante.permiso.tipoPermiso.nombre}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                <dd className="text-lg text-gray-900">{comprobante.permiso.tipoPermiso.descripcion}</dd>
              </div>
            </dl>
          </section>

          {/* Información del ciudadano */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información del Ciudadano
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="text-lg text-gray-900">{nombreCompleto}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">CURP</dt>
                <dd className="text-lg text-gray-900">{ciudadano.curp}</dd>
              </div>
              {ciudadano.rfc && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">RFC</dt>
                  <dd className="text-lg text-gray-900">{ciudadano.rfc}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Código QR */}
          <section className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Código de Verificación
            </h2>
            <img
              src={comprobante.codigoQR}
              alt="Código QR"
              className="w-48 h-48"
            />
            <p className="text-sm text-gray-600 text-center mt-2">
              Escanea este código para verificar la autenticidad del comprobante
            </p>
          </section>

          {/* Pie de página */}
          <footer className="border-t pt-6 text-center text-sm text-gray-500">
            <p>Este documento es un comprobante válido de pago.</p>
            <p className="mt-1">Registrado por: {comprobante.usuarioRegistro.nombre}</p>
            <p className="mt-1">Generado el: {new Date().toLocaleString('es-MX')}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 Estilos para Impresión (CSS)

```css
/* src/styles/print.css */

@media print {
  /* Ocultar elementos innecesarios */
  nav,
  header,
  footer,
  button,
  .no-print {
    display: none !important;
  }

  /* Optimizar para papel */
  body {
    background: white;
    font-size: 12pt;
  }

  /* Evitar saltos de página dentro de secciones */
  section {
    page-break-inside: avoid;
  }

  /* Tamaño de QR para impresión */
  img[alt="Código QR"] {
    width: 120px !important;
    height: 120px !important;
  }
}
```

---

## ✅ Checklist de Implementación

### Backend (Ya completado ✅)
- [x] Schema de Prisma actualizado
- [x] Migración aplicada
- [x] Service con métodos de enlaces públicos
- [x] Controller con endpoints públicos
- [x] Variables de entorno configuradas

### Frontend (Por implementar)
- [ ] Instalar dependencias (`jspdf`, `jspdf-autotable`)
- [ ] Crear servicio de API (`pagosPermisosService.ts`)
- [ ] Implementar generador de PDF (`pdfGenerator.ts`)
- [ ] Implementar compartir por WhatsApp (`whatsappShare.ts`)
- [ ] Crear hook personalizado (`useComprobantePublico.ts`)
- [ ] Crear componente ShareButton
- [ ] Crear página pública `/comprobantes/:token`
- [ ] Agregar estilos de impresión
- [ ] Configurar variable `VITE_API_URL` en `.env`

### Testing
- [ ] Probar generación de enlace público
- [ ] Probar compartir en móvil (Web Share API)
- [ ] Probar compartir en PC (WhatsApp Web)
- [ ] Probar descarga de PDF
- [ ] Probar impresión del comprobante
- [ ] Probar enlace expirado
- [ ] Probar en diferentes navegadores

---

## 🚀 Próximos Pasos

1. **Instalar dependencias**:
   ```bash
   npm install jspdf jspdf-autotable
   ```

2. **Crear archivos del módulo** siguiendo la estructura sugerida

3. **Configurar variables de entorno**:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. **Probar en desarrollo**:
   ```bash
   npm run dev
   ```

5. **Desplegar y probar en producción**

---

## 📚 Recursos Adicionales

- [jsPDF Documentation](https://artskydj.github.io/jsPDF/docs/)
- [jspdf-autotable Examples](https://github.com/simonbengtsson/jsPDF-AutoTable)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- [WhatsApp Click to Chat](https://faq.whatsapp.com/5913398998672934)

---

## 💡 Tips

- **Validación de tokens**: El backend ya valida automáticamente la expiración
- **SEO**: Considera agregar meta tags en la página pública
- **Analytics**: Puedes agregar tracking (sin identificar al usuario)
- **Cache**: El endpoint público puede usar cache HTTP (72 horas)
- **PWA**: Si tu app es PWA, el Web Share API funcionará mejor
