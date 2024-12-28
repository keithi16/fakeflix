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
import { CreateMovieUseCase } from '@src/module/content/application/use-case/create-movie.use-case';
import { CreateMovieInputDto } from '@src/module/content/http/rest/dto/request/create-movie.dto';
import { CreateMovieResponseDto } from '@src/module/content/http/rest/dto/response/create-movie.dto';

import { randomUUID } from 'crypto';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('admin/movie')
export class AdminMovieController {
  constructor(private readonly createMovieUseCase: CreateMovieUseCase) {}
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
  async uploadMovie(
    @Req() _req: Request,
    @Body() contentData: CreateMovieInputDto,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] }
  ): Promise<CreateMovieResponseDto> {
    const videoFile = files.video?.[0];
    const thumbnailFile = files.thumbnail?.[0];

    if (!videoFile || !thumbnailFile) {
      throw new BadRequestException('Both video and thumbnail files are required.');
    }

    //TODO make it a custom pipe
    const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 gigabyte

    if (videoFile.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds the limit.');
    }
    const MAX_THUMBNAIL_SIZE = 1024 * 1024 * 10; // 10 megabytes

    if (thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
      throw new BadRequestException('Thumbnail size exceeds the limit.');
    }

    const createdMovie = await this.createMovieUseCase.execute({
      title: contentData.title,
      description: contentData.description,
      videoUrl: videoFile.path,
      thumbnailUrl: thumbnailFile.path,
      duration: 100, // TBD add logic to extract video duration
      sizeInKb: videoFile.size,
    });
    return {
      id: createdMovie.id,
      title: createdMovie.title,
      description: createdMovie.description,
      videoUrl: createdMovie.movie.video.url,
      thumbnailUrl: createdMovie.movie.thumbnail?.url,
      sizeInKb: createdMovie.movie.video.sizeInKb,
      duration: createdMovie.movie.video.duration,
    };
  }
}
