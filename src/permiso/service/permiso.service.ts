import { Injectable } from '@nestjs/common';
import { CreatePermisoDto } from '../dto/create-permiso.dto';
import { UpdatePermisoDto } from '../dto/update-permiso.dto';

@Injectable()
export class PermisoService {
  create(createPermisoDto: CreatePermisoDto) {
    return 'This action adds a new permiso';
  }

  findAll() {
    return `This action returns all permiso`;
  }

  findOne(id: number) {
    return `This action returns a #${id} permiso`;
  }

  update(id: number, updatePermisoDto: UpdatePermisoDto) {
    return `This action updates a #${id} permiso`;
  }

  remove(id: number) {
    return `This action removes a #${id} permiso`;
  }
}
