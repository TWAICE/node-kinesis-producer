import * as crypto from 'crypto';

import { CreateStreamCommand, KinesisClient } from '@aws-sdk/client-kinesis';
import anyTest, { TestInterface } from 'ava';
import kinesalite from 'kinesalite';
import { v4 as uuidv4 } from 'uuid';

import { KinesisProducer } from './kinesis.producer';
import { delay } from './utils';

const KINESIS_TEST_STREAM = 'test-stream';
const KINESIS_CONFIG = {
  endpoint: 'http://localhost:4567',
  tls: false,
  region: 'eu-west-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
};
const test = anyTest as TestInterface<{ producer: KinesisProducer }>;

test.before.cb('initialize kinesis stream', (t) => {
  console.log('creating server');
  const server = kinesalite({ createStreamMs: 50 });
  server.listen(4567, async (err: Error) => {
    console.log(err);
    if (err) throw err;
    const createStreamClient = new KinesisClient(KINESIS_CONFIG);
    await createStreamClient.send(
      new CreateStreamCommand({
        ShardCount: 1,
        StreamName: KINESIS_TEST_STREAM,
      })
    );
    await delay(1000);

    t.context.producer = new KinesisProducer(
      KINESIS_TEST_STREAM,
      KINESIS_CONFIG
    );
    t.end();
  });
});

test('put large number of small records', async (t) => {
  for (let i = 0; i < 1; i++) {
    const records = [];
    for (let j = 0; j < 500; j++) {
      records.push({
        Data: JSON.stringify({
          id: uuidv4(),
          attr: Math.random(),
          body: crypto.randomBytes(Math.ceil(Math.random())).toString('hex'),
        }),
      });
    }
    await t.context.producer.putRecords(records);
  }
  t.assert(true);
});

test('put small number of large records', async (t) => {
  for (let i = 0; i < 1; i++) {
    const records = [];
    for (let j = 0; j < 1; j++) {
      const singleRecord = [];
      for (let k = 0; k < 1; k++) {
        singleRecord.push({
          id: uuidv4(),
          attr: Math.random(),
          body: crypto.randomBytes(Math.ceil(Math.random())).toString('hex'),
        });
      }
      records.push({
        Data: JSON.stringify(singleRecord),
      });
    }
    await t.context.producer.putRecords(records);
  }
  t.assert(true);
});
