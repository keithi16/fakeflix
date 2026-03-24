import { ForbiddenException, HttpStatus, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
};

export type StreamResult = {
  statusCode: number;
  headers: Record<string, string | number>;
  stream: fs.ReadStream;
};

@Injectable()
export class VideoStreamingService {
  streamVideo(videoPath: string, range: string | undefined): StreamResult {
    const filePath = path.join('.', videoPath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ALLOWED_MIME_TYPES[ext];

    if (!contentType) {
      throw new ForbiddenException('Unsupported media type');
    }

    const fileSize = fs.statSync(filePath).size;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      return {
        statusCode: HttpStatus.PARTIAL_CONTENT,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        },
        stream,
      };
    }

    const stream = fs.createReadStream(filePath);
    return {
      statusCode: HttpStatus.OK,
      headers: {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      },
      stream,
    };
  }
}
