import { Injectable } from '@nestjs/common';
import { Content } from '../../../shared/core';

@Injectable()
export class ListContentUseCase {
  async execute(): Promise<Content[]> {
    return [];
  }
}
