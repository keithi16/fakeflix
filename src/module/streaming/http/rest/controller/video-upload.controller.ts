import {
  Body,
  Controller,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoEntity } from '@src/module/streaming/core/entity/video.entity';
import { VideoManagerService } from '@src/module/streaming/core/service/video-manager.service';
import { CreateVideoInputDto } from '@src/module/streaming/http/rest/dto/video-upload.dto';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const MAX_FILE_SIZE = 1024 * 1024 * 1024 * 1024; // 1 terabyte

@Controller('admin/video')
export class VideoUploadController {
  constructor(private readonly videoManagerService: VideoManagerService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      dest: './uploads',
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    })
  )
  async uploadDocument(
    @Req() _req: Request,
    @Body() uploadedVideo: CreateVideoInputDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: 'video/mp4' }),
        ],
      })
    )
    file: Express.Multer.File
  ) {
    const newVideo = VideoEntity.create({
      title: uploadedVideo.title,
      description: uploadedVideo.description,
      videoUrl: file.path,
      thumbnailUrl: 'uploads/test.jpg', //temporary
      duration: 100,
      size: file.size,
    });

    return await this.videoManagerService.createVideo(newVideo);
  }
}
