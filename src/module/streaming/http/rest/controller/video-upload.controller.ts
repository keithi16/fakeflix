import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
    FilesInterceptor('files', 2, {
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
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const videoFile = files.find((file) => file.mimetype === 'video/mp4');
    const thumbnailFile = files.find((file) => file.mimetype === 'image/jpeg');

    if (!videoFile || !thumbnailFile) {
      throw new BadRequestException('Both video and thumbnail files are required.');
    }

    if (videoFile.size > MAX_FILE_SIZE || thumbnailFile.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds the limit.');
    }
    const newVideo = VideoEntity.create({
      title: uploadedVideo.title,
      description: uploadedVideo.description,
      videoUrl: videoFile.path,
      thumbnailUrl: thumbnailFile.path,
      duration: 100, // TBD add logic to extract video duration
      sizeInKb: videoFile.size,
    });

    return await this.videoManagerService.createVideo(newVideo);
  }
}
