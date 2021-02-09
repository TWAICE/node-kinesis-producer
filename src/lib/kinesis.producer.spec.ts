import * as crypto from 'crypto';

import { CreateStreamCommand } from '@aws-sdk/client-kinesis';
import anyTest, { TestInterface } from 'ava';
import kinesalite from 'kinesalite';
import sinon from 'sinon';
import { v4 as uuidv4 } from 'uuid';

import { delay } from '../helpers/utils';

import { KinesisRecord } from './interfaces';
import { KinesisProducer } from './kinesis.producer';

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

test.beforeEach.cb('it initializes test kinesis stream', (t) => {
  t.context.kinesis = kinesalite({ createStreamMs: 50 });
  t.context.kinesis.listen(4567, async (err: Error) => {
    if (err) throw err;

    t.context.producer = new KinesisProducer({
      streamName: KINESIS_TEST_STREAM,
      clientConfig: KINESIS_CONFIG,
      maxRetries: MAX_RETRIES,
    });

    await t.context.producer.client.send(
      new CreateStreamCommand({
        ShardCount: 1,
        StreamName: KINESIS_TEST_STREAM,
      })
    );
    await delay(2000);
    t.end();
  });
});

test.serial('it handles large amount of records', async (t) => {
  for (let i = 0; i < 100; i++) {
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

test.serial('it handles multiple large payloads', async (t) => {
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

test.serial('it handles large payload', async (t) => {
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

test.serial('it throws error on empty payload', async (t) => {
  await t.throwsAsync(async () => {
    await t.context.producer.flushQueue();
  });
});

test.serial('it retries failed records', async (t) => {
  const sendFake = sinon.fake();
  const error = await t.throwsAsync(async () => {
    t.context.producer.client.send = sendFake;
    await t.context.producer.putRecords([
      {
        Data: 'test',
      },
    ]);
    await t.context.producer.flushQueue();
  });
  t.is(sendFake.callCount, 3);
  t.is(error.message, `Max retries ${MAX_RETRIES} reached for this batch.`);
});

test.serial('it flushes the queue periodically', async (t) => {
  const flushQueueFake = sinon.fake();
  t.context.producer.flushQueue = flushQueueFake;
  await t.context.producer.putRecords([
    {
      Data: 'test',
    },
  ]);
  await delay(5000);
  t.assert(flushQueueFake.called);
});

test.serial("it doesn't flush queue if empty", async (t) => {
  const flushQueueFake = sinon.fake();
  t.context.producer.flushQueue = flushQueueFake;
  await delay(5000);
  t.assert(flushQueueFake.notCalled);
});

test.afterEach.cb('it closes test kinesis stream', (t) => {
  t.context.kinesis.close((err: Error) => {
    t.end(err);
    t.context.producer.close();
  });
});
