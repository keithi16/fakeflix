import { Injectable } from '@nestjs/common';
import { ContentMedia } from '@src/module/content/persistence/entity/content-media.entity';
import { DynamoDBService } from '@src/shared/module/persistence/dynamodb/service/dynamodb.service';

@Injectable()
export class ContentMediaRepository {
  constructor(private readonly dynamoDbService: DynamoDBService) {}

  async save(content: ContentMedia): Promise<void> {
    try {
      /**
       * This uses DynamoDB Single table design pattern
       * This allows full query capabilities on all necessary atributes
       */
      await this.dynamoDbService.putItem({
        TableName: 'SingleTable',
        Item: {
          pk: `CONTENT#${content.contentId}`,
          sk: `CREATE_DATE#${content.createdAt}`,
          gsi1pk: `MOVIE#${content.movieId}`,
          gsi1sk: `VIDEO_DATE#${content.metadata.createdAt}`,
          gsi2pk: `VIDEO#${content.metadata.videoId}`,
          gsi2sk: `VIDEO_DATE#${content.metadata.createdAt}`,
          contentId: content.contentId,
          entityName: 'CONTENT',
          title: content.title,
          description: content.description,
          type: content.type,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
          movieId: content.movieId,
          metadata: content.metadata,
        },
      });
    } catch (error) {
      throw new Error(`Error saving content ${(error as Error)?.message}`);
    }
  }

  async getVideoById(videoId: string): Promise<ContentMedia | undefined> {
    const result = await this.dynamoDbService.query({
      TableName: 'SingleTable',
      IndexName: 'GSI2',
      KeyConditionExpression: 'gsi2pk = :videoId',
      ExpressionAttributeValues: {
        ':videoId': `VIDEO#${videoId}`,
      },
    });

    if (result.Count === 0 || !result.Items) {
      return undefined;
    }

    return result.Items[0] as ContentMedia;
  }

  async deleteAll(): Promise<void> {
    await this.dynamoDbService.deleteAll();
  }
}
