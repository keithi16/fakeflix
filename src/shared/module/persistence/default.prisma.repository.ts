import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BaseEntity, ExposeFieldControl } from '@src/shared/core/entity/base.entity';
import {
  StorageClientException,
  StorageInternalException,
} from '@src/shared/core/exception/storage.exception';

@Injectable()
export abstract class DefaultPrismaRepository<
  Entity extends BaseEntity,
  QueryableFields extends object
> {
  constructor(
    /**
     * TODO
     * Temporary any due to limitations in Prisma typings
     * it's still very hacky at the moment
     * https://github.com/prisma/prisma/discussions/3929
     * https://github.com/prisma/prisma/issues/5273
     * I'll leave it open while researching a clean way to do it
    /**/
    protected readonly model: any,
    protected readonly Entity: { new (args: any): Entity }
  ) {}

  async findAll(): Promise<Entity[]> {
    try {
      return await this.model.findMany();
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }

  async findOne(fields: Partial<QueryableFields>): Promise<Entity | null> {
    try {
      const data = await this.model.findFirst({ where: fields });

      if (data) {
        return new this.Entity(data);
      }

      return null;
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }

  async save(entity: Entity): Promise<Entity> {
    try {
      const createdEntity = await this.model.create({
        data: entity.serialize(ExposeFieldControl.INTERNAL),
      });
      return new this.Entity(createdEntity);
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.model.deleteMany();
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }

  protected handleAndThrowError(error: unknown): never {
    const errorMessage = this.extractErrorMessage(error);
    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new StorageClientException(error.message);
    }

    throw new StorageInternalException(errorMessage);
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'An unexpected error occurred.';
  }
}
