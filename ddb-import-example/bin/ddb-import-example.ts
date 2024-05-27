#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { stages } from '../app-config';
import { DdbImportExampleStatefulStack } from '../stateful/stateful';

const app = new cdk.App();
new DdbImportExampleStatefulStack(app, 'DdbImportExampleStatefulStack', {
  stage: stages.dev,
});
