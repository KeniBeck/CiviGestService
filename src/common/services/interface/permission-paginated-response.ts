import { PaginatedResponse } from './paginate-operation';

export interface PermissionStats {
  totalActive: number;
  totalInactive: number;
  totalResources: number;
  resources: string[];
}

export interface PermissionPaginatedResponse<T> extends PaginatedResponse<T> {
  stats: PermissionStats;
}
