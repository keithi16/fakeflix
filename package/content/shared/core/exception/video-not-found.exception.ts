import { NotFoundException } from '@nestjs/common';

export class VideoNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(message);
    this.name = VideoNotFoundException.name;
  }
}
