import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';

import { Construct } from 'constructs';
import { stages } from '../app-config';
import { SimpleTable } from '../constructs/simple-table';

export interface DdbImportExampleStatefulStackProps extends cdk.StackProps {
  stage: string;
}

export class DdbImportExampleStatefulStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: DdbImportExampleStatefulStackProps
  ) {
    super(scope, id, props);

    new SimpleTable(this, 'SimpleTable', {
      tableName: `ddb-import-example-table-${props.stage}`,
      stageName: props.stage, // the current stack stage from stack props
      nonStages: [stages.prod, stages.staging], // the stages where we don't want to autopopulate the table
      dataPath: path.join(__dirname, '../data/'), // the path to the json file
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
    }).table;
  }
}
