import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ContentEntity } from '@src/module/content/shared/core/entity/content.entity';
import { MovieEntity } from '@src/module/content/shared/core/entity/movie.entity';
import { ThumbnailEntity } from '@src/module/content/shared/core/entity/thumbnail.entity';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { PersistenceInternalException } from '@src/shared/core/exception/storage.exception';
import { DefaultPrismaRepository } from '@src/shared/module/persistence/default.prisma.repository';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';
export interface ContentFilterOpts {
  movie: string;
}
@Injectable()
export class ContentRepository extends DefaultPrismaRepository {
  private readonly model: PrismaService['content'];
  constructor(prismaService: PrismaService) {
    super();
    this.model = prismaService.content;
  }

  async save(content: ContentEntity): Promise<void> {
    try {
      const movie = content.getMedia();
      if (!movie) {
        throw new PersistenceInternalException('Video must be present');
      }
      const video = movie.getVideo();

      await this.model.create({
        data: {
          id: content.getId(),
          type: content.getType(),
          title: content.getTitle(),
          description: content.getDescription(),
          createdAt: content.getCreatedAt(),
          updatedAt: content.getUpdatedAt(),
          Thumbnail: {
            create: content.getThumbnail()?.serialize(),
          },
          Movie: {
            create: {
              id: movie.getId(),
              createdAt: movie.getCreatedAt(),
              updatedAt: movie.getUpdatedAt(),
              Video: {
                create: video.serialize(),
              },
            },
          },
        },
      });
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }

  async findById(id: string): Promise<ContentEntity | undefined> {
    try {
      const content = await this.model.findUnique({
        where: { id },
        include: {
          Thumbnail: true,
          Movie: {
            include: { Video: true },
          },
        },
      });
      if (!content) {
        return;
      }

      return this.mapToEntity(content);
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }

  async findAll(filter?: ContentFilterOpts): Promise<ContentEntity[]> {
    try {
      const contents = await this.model.findMany({
        include: {
          ...{ Thumbnail: true },
          ...(filter?.movie && {
            Movie: {
              include: { Video: true },
            },
          }),
        },
      });
      return contents.map((content) => this.mapToEntity(content));
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }

  async clear(): Promise<{ count: number }> {
    try {
      return await this.model.deleteMany();
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }

  mapToEntity<
    T extends Prisma.ContentGetPayload<{
      include: {
        Thumbnail: true;
        Movie?:
          | {
              include: { Video: true };
            }
          | undefined;
      };
    }>
  >(
    //temporary type, will be more dynamic in the feature
    content: T | null
  ): ContentEntity {
    if (!content || !content.Movie) {
      //Temporary until I add support to tv shows
      throw new PersistenceInternalException('Movie and video must be present');
    }

    const contentEntity = ContentEntity.createFrom({
      id: content.id,
      type: content.type,
      title: content.title,
      description: content.description,
      createdAt: new Date(content.createdAt),
      updatedAt: new Date(content.updatedAt),
    });
    if (this.isMovie(content) && content.Movie.Video) {
      contentEntity.addMedia(
        MovieEntity.createFrom({
          id: content.Movie.id,
          createdAt: new Date(content.Movie.createdAt),
          updatedAt: new Date(content.Movie.updatedAt),
          video: VideoEntity.createFrom({
            id: content.Movie.Video.id,
            url: content.Movie.Video.url,
            duration: content.Movie.Video.duration,
            sizeInKb: content.Movie.Video.sizeInKb,
            createdAt: new Date(content.Movie.Video.createdAt),
            updatedAt: new Date(content.Movie.Video.updatedAt),
          }),
        })
      );
    }
    if (content.Thumbnail) {
      contentEntity.addThumbnail(
        ThumbnailEntity.createFrom({
          id: content.Thumbnail.id,
          url: content.Thumbnail.url,
          createdAt: new Date(content.Thumbnail.createdAt),
          updatedAt: new Date(content.Thumbnail.updatedAt),
        })
      );
    }
    return contentEntity;
  }

  private isMovie(content: unknown): content is Prisma.ContentGetPayload<{
    include: {
      Movie: {
        include: { Video: true };
      };
    };
  }> {
    if (typeof content === 'object' && content !== null && 'Movie' in content) {
      return true;
    }
    return false;
  }
}
