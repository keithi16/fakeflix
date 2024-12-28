import { Controller, Get, Header, HttpStatus, Param, Req, Res } from '@nestjs/common';
import { GetStreamingURLUseCase } from '@src/module/content/application/use-case/get-streaming-url.use-case';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('player')
export class MediaPlayerController {
  constructor(private readonly getStreamingURLUSeCase: GetStreamingURLUseCase) {}
  @Get('stream/:videoId')
  @Header('Content-Type', 'video/mp4')
  async streamVideo(
    @Param('videoId') videoId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const videoUrl = await this.getStreamingURLUSeCase.execute(videoId);
    console.log('here', videoUrl);
    const videoPath = path.join('.', videoUrl);
    const fileSize = fs.statSync(videoPath).size;

    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });

      res.writeHead(HttpStatus.PARTIAL_CONTENT, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });

      file.pipe(res);
    } else {
      res.writeHead(HttpStatus.OK, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  }
}
