import * as QRCode from 'qrcode';

/**
 * Generar código QR en formato Data URL (base64)
 * @param data - Datos a codificar en el QR
 * @param options - Opciones de configuración del QR
 * @returns Data URL del QR generado
 */
export async function generateQR(
  data: string,
  options?: QRCode.QRCodeToDataURLOptions,
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    type: 'image/png',
    width: 300,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
    ...options,
  };

  try {
    const qrDataURL = await QRCode.toDataURL(data, defaultOptions);
    return qrDataURL;
  } catch (error) {
    console.error('Error al generar código QR:', error);
    throw new Error('No se pudo generar el código QR');
  }
}

/**
 * Generar código QR en formato Buffer (para guardar como archivo)
 * @param data - Datos a codificar en el QR
 * @param options - Opciones de configuración del QR
 * @returns Buffer del QR generado
 */
export async function generateQRBuffer(
  data: string,
  options?: QRCode.QRCodeToBufferOptions,
): Promise<Buffer> {
  const defaultOptions: QRCode.QRCodeToBufferOptions = {
    type: 'png',
    width: 300,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
    ...options,
  };

  try {
    const qrBuffer = await QRCode.toBuffer(data, defaultOptions);
    return qrBuffer;
  } catch (error) {
    console.error('Error al generar código QR:', error);
    throw new Error('No se pudo generar el código QR');
  }
}
