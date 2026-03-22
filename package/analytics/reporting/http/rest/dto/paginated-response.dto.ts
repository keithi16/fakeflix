import { Expose, Type } from 'class-transformer';

export class PaginationMetaDto {
  @Expose() page: number;
  @Expose() limit: number;
  @Expose() totalItems: number;
  @Expose() totalPages: number;
}

export class PaginatedResponseDto<T> {
  @Expose() data: T[];
  @Expose() @Type(() => PaginationMetaDto) pagination: PaginationMetaDto;
}
