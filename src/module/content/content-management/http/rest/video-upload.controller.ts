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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { VideoEntity } from '@src/module/content/content-management/core/entity/video.entity';
import { VideoManagementService } from '@src/module/content/content-management/core/service/video-managament.service';
import { CreateVideoInputDto } from '@src/module/content/content-management/http/rest/dto/video-upload.dto';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('admin/video')
export class VideoUploadController {
  constructor(private readonly videoManagementService: VideoManagementService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        dest: './uploads',
        storage: diskStorage({
          destination: './uploads',
          filename: (_req, file, cb) => {
            return cb(null, `${Date.now()}-${randomUUID()}${extname(file.originalname)}`);
          },
        }),
        fileFilter: (_req, file, cb) => {
          if (file.mimetype !== 'video/mp4' && file.mimetype !== 'image/jpeg') {
            return cb(
              new BadRequestException(
                'Invalid file type. Only video/mp4 and image/jpeg are supported.'
              ),
              false
            );
          }
          return cb(null, true);
        },
      }
    )
  )
  async uploadDocument(
    @Req() _req: Request,
    @Body() uploadedVideo: CreateVideoInputDto,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] }
  ) {
    const videoFile = files.video?.[0];
    const thumbnailFile = files.thumbnail?.[0];

    if (!videoFile || !thumbnailFile) {
      throw new BadRequestException('Both video and thumbnail files are required.');
    }

    //TODO review if the entity should be exposed here
    if (videoFile.size > VideoEntity.getMaxFileSize()) {
      throw new BadRequestException('File size exceeds the limit.');
    }
    if (thumbnailFile.size > VideoEntity.getMaxThumbnailSize()) {
      throw new BadRequestException('Thumbnail size exceeds the limit.');
    }

    return await this.videoManagementService.create({
      title: uploadedVideo.title,
      description: uploadedVideo.description,
      videoUrl: videoFile.path,
      thumbnailUrl: thumbnailFile.path,
      duration: 100, // TBD add logic to extract video duration
      sizeInKb: videoFile.size,
    });
  }
}
