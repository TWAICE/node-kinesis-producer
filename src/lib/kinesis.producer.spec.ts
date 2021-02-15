import * as crypto from 'crypto';

import { CreateStreamCommand } from '@aws-sdk/client-kinesis';
import anyTest, { TestInterface } from 'ava';
import kinesalite from 'kinesalite';
import { v4 as uuidv4 } from 'uuid';

import { KinesisProducer } from './kinesis.producer';
import { KinesisRecord } from './kinesis.record.interface';
import kinesisClientMock from './mocks/kinesis.mock';
import { delay } from './utils';

const KINESIS_TEST_STREAM = 'test-stream';
const MAX_RETRIES = 3;
const KINESIS_CONFIG = {
  endpoint: 'http://localhost:4567',
  tls: false,
  region: 'eu-west-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
};
const test = anyTest as TestInterface<{
  producer: KinesisProducer;
  kinesis: {
    listen: (port: number, callback: unknown) => void;
    close: (callback: unknown) => void;
  };
}>;

test.beforeEach.cb('initialize kinesis stream', (t) => {
  t.context.kinesis = kinesalite({ createStreamMs: 50 });
  t.context.kinesis.listen(4567, async (err: Error) => {
    if (err) throw err;

    t.context.producer = new KinesisProducer(
      KINESIS_TEST_STREAM,
      KINESIS_CONFIG,
      500,
      1024 * 1024,
      10,
      MAX_RETRIES
    );

    await t.context.producer.client.send(
      new CreateStreamCommand({
        ShardCount: 1,
        StreamName: KINESIS_TEST_STREAM,
      })
    );
    await delay(1000);
    t.end();
  });
});

test.serial('put large number of small records', async (t) => {
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

test.serial('put small number of large records', async (t) => {
  for (let i = 0; i < 10; i++) {
    const records: KinesisRecord[] = [];
    for (let j = 0; j < 10; j++) {
      const singleRecord = [];
      for (let k = 0; k < 1000; k++) {
        singleRecord.push({
          id: uuidv4(),
          attr: Math.random(),
          body: crypto.randomBytes(Math.ceil(Math.random())).toString('hex'),
        });
      }

      records.push({
        Data: JSON.stringify(singleRecord),
        PartitionKey: crypto.randomBytes(20).toString('hex'),
        ExplicitHashKey: `${j}`,
      });
    }
    await t.context.producer.putRecords(records);
  }
  t.assert(true);
});

test.serial('very large payload', async (t) => {
  const singleRecord: Record<string, unknown>[] = [];
  for (let k = 0; k < 100000; k++) {
    singleRecord.push({
      id: uuidv4(),
      attr: Math.random(),
      body: crypto.randomBytes(Math.ceil(Math.random())).toString('hex'),
    });
  }
  await t.throwsAsync(async () => {
    await t.context.producer.putRecord({
      Data: JSON.stringify(singleRecord),
    });
  });
});

test.serial('fail on empty payload', async (t) => {
  await t.throwsAsync(async () => {
    await t.context.producer.flushQueue();
  });
});

test.serial('should retry failed records', async (t) => {
  const error = await t.throwsAsync(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    t.context.producer.client = kinesisClientMock;
    await t.context.producer.putRecords([
      {
        Data: 'test',
      },
    ]);
    await t.context.producer.flushQueue();
  });
  t.is(error.message, `Max retries ${MAX_RETRIES} reached for this batch.`);
});

test.afterEach.cb('close kinesalite', (t) => {
  t.context.kinesis.close((err: Error) => {
    t.end(err);
  });
});
