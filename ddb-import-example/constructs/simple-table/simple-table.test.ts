import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';

import { Match, Template } from 'aws-cdk-lib/assertions';

import { SimpleTable } from '../simple-table';

describe('SimpleTable', () => {
  let stack: cdk.Stack;

  beforeEach(() => {
    stack = new cdk.Stack();
  });

  describe('when using default props without the optional props', () => {
    test('should create a dynamodb table with the correct properties', () => {
      new SimpleTable(stack, 'SimpleTable', {
        stageName: 'dev',
        partitionKey: {
          name: 'PK',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'SK',
          type: dynamodb.AttributeType.STRING,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        tableName: 'TestTable',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          {
            AttributeName: 'PK',
            AttributeType: 'S',
          },
          {
            AttributeName: 'SK',
            AttributeType: 'S',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        ContributorInsightsSpecification: {
          Enabled: true,
        },
        KeySchema: [
          {
            AttributeName: 'PK',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'SK',
            KeyType: 'RANGE',
          },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: {
          SSEEnabled: true,
        },
        TableName: 'TestTable',
      });
    });

    test('should not create an S3 bucket and deployment', () => {
      new SimpleTable(stack, 'SimpleTable', {
        stageName: 'dev',
        partitionKey: {
          name: 'PK',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'SK',
          type: dynamodb.AttributeType.STRING,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        tableName: 'TestTable',
      });

      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::S3::Bucket', 0);
      template.resourceCountIs('Custom::CDKBucketDeployment', 0);
    });
  });

  describe('when nonStages is provided as a property', () => {
    test('should throw an error if dataPath is not provided', () => {
      expect(() => {
        new SimpleTable(stack, 'SimpleTable', {
          stageName: 'dev',
          partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          tableName: 'TestTable',
          nonStages: ['prod'], // added without supplying a dataPath value
        });
      }).toThrow('dataPath is required when suppling nonStages value');
    });

    describe('when stack stage is not in nonStages', () => {
      test('should create an S3 bucket and deployment when in non-prod stage', () => {
        // dev stage and non stages is prod - so we should import data
        new SimpleTable(stack, 'SimpleTable', {
          stageName: 'dev',
          partitionKey: {
            name: 'PK',
            type: dynamodb.AttributeType.STRING,
          },
          sortKey: {
            name: 'SK',
            type: dynamodb.AttributeType.STRING,
          },
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          tableName: 'TestTable',
          nonStages: ['prod'],
          dataPath: path.join(__dirname, './test-data/'),
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::S3::Bucket', 1);
        template.resourceCountIs('Custom::CDKBucketDeployment', 1);

        template.hasResourceProperties('AWS::DynamoDB::Table', {
          ImportSourceSpecification: {
            InputCompressionType: 'NONE',
            InputFormat: 'DYNAMODB_JSON',
            S3BucketSource: {
              S3Bucket: {},
            },
          },
          AttributeDefinitions: [
            {
              AttributeName: 'PK',
              AttributeType: 'S',
            },
            {
              AttributeName: 'SK',
              AttributeType: 'S',
            },
          ],
          BillingMode: 'PAY_PER_REQUEST',
          ContributorInsightsSpecification: {
            Enabled: true,
          },
          KeySchema: [
            {
              AttributeName: 'PK',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'SK',
              KeyType: 'RANGE',
            },
          ],
          PointInTimeRecoverySpecification: {
            PointInTimeRecoveryEnabled: true,
          },
          SSESpecification: {
            SSEEnabled: true,
          },
          TableName: 'TestTable',
        });
      });
    });

    describe('when stack stage is in nonStages', () => {
      test('should not create an S3 bucket and deployment', () => {
        // prod stage and non stages is prod - so we should not import data
        new SimpleTable(stack, 'SimpleTable', {
          stageName: 'prod',
          partitionKey: {
            name: 'PK',
            type: dynamodb.AttributeType.STRING,
          },
          sortKey: {
            name: 'SK',
            type: dynamodb.AttributeType.STRING,
          },
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          tableName: 'TestTable',
          nonStages: ['prod'],
          dataPath: path.join(__dirname, './test-data/'),
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::DynamoDB::Table', {
          ImportSourceSpecification: Match.absent(),
        });

        template.resourceCountIs('AWS::S3::Bucket', 0);
        template.resourceCountIs('Custom::CDKBucketDeployment', 0);
      });
    });
  });
});
