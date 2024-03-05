import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

@Injectable()
export class DynamoDBService {
  getClient(): DocumentClient {
    return new AWS.DynamoDB.DocumentClient({
      /**
       * TODO: use env vars
       */
      region: 'us-east-1',
      endpoint: 'http://localhost:4566',
    });
  }

  putItem(params: DocumentClient.PutItemInput): Promise<DocumentClient.PutItemOutput> {
    return this.getClient().put(params).promise();
  }

  query(params: DocumentClient.QueryInput): Promise<DocumentClient.QueryOutput> {
    return this.getClient().query(params).promise();
  }

  async deleteAll(): Promise<void> {
    await this.getClient()
      .scan({
        TableName: 'SingleTable',
      })
      .promise()
      .then((result) => {
        if (result.Items) {
          return Promise.all(
            result.Items.map((item) =>
              this.getClient()
                .delete({
                  TableName: 'SingleTable',
                  Key: {
                    pk: item.pk,
                    sk: item.sk,
                  },
                })
                .promise()
            )
          );
        }
      });
  }
}
