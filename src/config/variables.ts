/**
 * Variables de entorno del sistema
 * Centraliza la lectura de variables .env para fácil acceso
 */

export const IMAGES_PATH = process.env.IMAGES_PATH || '~/images';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
export const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const DATABASE_URL = process.env.DATABASE_URL;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = parseInt(process.env.PORT || '3000', 10);
