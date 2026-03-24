import { Controller, Get, Header, Param, Req, Res } from '@nestjs/common';
import { VideoStreamingService } from '../../../core/service/video-streaming.service';
import { GetStreamingURLUseCase } from '../../../core/use-case/get-streaming-url.use-case';
import { Request, Response } from 'express';

@Controller('player')
export class MediaPlayerController {
  constructor(
    private readonly getStreamingURLUSeCase: GetStreamingURLUseCase,
    private readonly videoStreamingService: VideoStreamingService,
  ) {}

  @Get('stream/:videoId')
  @Header('Content-Type', 'video/mp4')
  async streamVideo(
    @Param('videoId') videoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const videoUrl = await this.getStreamingURLUSeCase.execute(videoId);
    const { statusCode, headers, stream } = this.videoStreamingService.streamVideo(
      videoUrl,
      req.headers.range,
    );
    res.writeHead(statusCode, headers);
    stream.pipe(res);
  }
}
