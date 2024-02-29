import AWS from 'aws-sdk';
import dbSchema from './schema.json';

AWS.config.update({ region: 'us-east-1' });

const ddb = new AWS.DynamoDB({
  apiVersion: '2012-08-10',
  endpoint: 'http://localhost:4566',
});

ddb.createTable(dbSchema, function (err, data) {
  if (err) {
    console.log('Error', err);
  } else {
    console.log('Table Created', data);
  }
});
