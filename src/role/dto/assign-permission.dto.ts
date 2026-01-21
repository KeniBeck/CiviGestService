import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para asignar un permiso a un rol
 */
export class AssignPermissionDto {
  @ApiProperty({
    description: 'ID del permiso a asignar',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  permissionId: number;
}

/**
 * DTO para asignar múltiples permisos a un rol
 */
export class AssignMultiplePermissionsDto {
  @ApiProperty({
    description: 'Array de IDs de permisos a asignar',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  permissionIds: number[];
}

/**
 * DTO para sincronizar todos los permisos de un rol
 */
export class SyncPermissionsDto {
  @ApiProperty({
    description: 'Array de IDs de permisos que debe tener el rol (reemplaza todos)',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  permissionIds: number[];
}
