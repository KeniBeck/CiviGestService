import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Pipe para transformar string a boolean en query params
 * Permite manejar valores como 'true', 'false', '1', '0'
 */
@Injectable()
export class BooleanTransformPipe implements PipeTransform<string | boolean, boolean> {
  constructor(private readonly defaultValue: boolean = true) {}

  transform(value: string | boolean, metadata: ArgumentMetadata): boolean {
    // Si el valor no está definido, usar el valor por defecto
    if (value === undefined || value === null) {
      return this.defaultValue;
    }

    // Si ya es booleano, retornarlo
    if (typeof value === 'boolean') {
      return value;
    }

    // Convertir string a boolean
    if (typeof value === 'string') {
      const normalizedValue = value.toLowerCase().trim();
      
      if (normalizedValue === 'true' || normalizedValue === '1') {
        return true;
      }
      
      if (normalizedValue === 'false' || normalizedValue === '0') {
        return false;
      }
    }

    // Si no se puede convertir, usar el valor por defecto
    return this.defaultValue;
  }
}
