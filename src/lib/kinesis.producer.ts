import * as crypto from 'crypto';

import {
  KinesisClient,
  PutRecordsCommand,
  PutRecordsRequestEntry,
  PutRecordsResultEntry,
} from '@aws-sdk/client-kinesis';
import { KinesisClientConfig } from '@aws-sdk/client-kinesis/KinesisClient';

import { KinesisRecord } from './kinesis.record.interface';
import { delay, getRecordSizeInBytes, logger } from './utils';
export class KinesisProducer {
  private readonly streamName: string;
  private queue: Array<PutRecordsRequestEntry>;
  private readonly batchSize: number;
  private readonly batchSizeInBytes: number;
  private readonly batchTime: number;
  private readonly maxRetries: number;
  private queueSizeInBytes: number;
  private _client: KinesisClient;

  /**
   * Kinesis Producer
   * @param streamName: Name of the stream to send the records.
   * @param clientConfig: Configuration for AWS-SDK Kinesis Client.
   * @param batchSize: Numbers of records to batch before flushing the queue.
   * @param batchSizeInBytes: Maximum size in bytes to batch before flushing the queue.
   * @param batchTime: Maximum of seconds to wait before flushing the queue.
   * @param maxRetries: Maximum number of times to retry the put operation.
   */
  constructor(
    streamName: string,
    clientConfig: KinesisClientConfig,
    batchSize = 500,
    batchSizeInBytes = 1024 * 1024,
    batchTime = 5,
    maxRetries = 10
  ) {
    this.streamName = streamName;
    this._client = new KinesisClient(clientConfig);
    this.queue = [];
    this.batchSize = Math.min(500, batchSize);
    this.batchSizeInBytes = batchSizeInBytes;
    this.batchTime = batchTime;
    this.maxRetries = maxRetries;
    this.queueSizeInBytes = 0;
  }

  /**
   * Add a list of data records to the record queue in the proper format.
   * Convenience method that calls putRecord for each element.
   * @param records: List of KinesisRecord to send.
   */
  public async putRecords(records: Array<KinesisRecord>) {
    for (const record of records) {
      await this.putRecord(record);
    }
  }

  /**
   * Add a record to batch queue to be sent to kinesis stream.
   * Flushes the queue if flushing conditions are met.
   * @param kinesisRecord
   */
  public async putRecord(kinesisRecord: KinesisRecord) {
    if (!kinesisRecord.PartitionKey) {
      kinesisRecord.PartitionKey = crypto.randomBytes(20).toString('hex');
    }

    if (typeof kinesisRecord.Data == 'string') {
      kinesisRecord.Data = Buffer.from(kinesisRecord.Data);
    }
    const recordSize = getRecordSizeInBytes(kinesisRecord);
    if (recordSize > this.batchSizeInBytes) {
      throw new Error(
        `Record size ${recordSize} cannot be greater than batchSize ${this.batchSizeInBytes}
         for record with PartitionKey: ${kinesisRecord.PartitionKey}`
      );
    }
    const shouldFlush =
      this.queue.length + 1 > this.batchSize ||
      this.queueSizeInBytes + recordSize > this.batchSizeInBytes;

    if (shouldFlush) {
      logger.info(
        `Flushed Queue of Length: ${this.queue.length}, Size: ${(
          this.queueSizeInBytes / 1024
        ).toFixed(2)} KiB`
      );
      await this.flushQueue();
    }
    const putRecordInput: PutRecordsRequestEntry = {
      Data: kinesisRecord.Data,
      PartitionKey: kinesisRecord.PartitionKey,
      ExplicitHashKey: kinesisRecord.ExplicitHashKey,
    };

    this.queue.push(putRecordInput);
    this.queueSizeInBytes += recordSize;
  }

  /**
   * Flush all the current queue records to Kinesis.
   */
  public async flushQueue() {
    await this.sendRecords(this.queue);
  }

  /**
   * Send records to the Kinesis stream.
   * Failed records are sent again with an exponential backoff.
   * @param records: Records to put in the stream.
   * @param attempt: Number of times the records have been sent without success.
   * @private
   */
  private async sendRecords(
    records: Array<PutRecordsRequestEntry>,
    attempt = 1
  ): Promise<PutRecordsResultEntry[] | undefined | null> {
    if (attempt > this.maxRetries) {
      throw new Error(`Max retries ${this.maxRetries} reached for this batch.`);
    }

    // exponential backoff before retrying.
    await delay(2 ** attempt * 0.1);

    const command = new PutRecordsCommand({
      StreamName: this.streamName,
      Records: records,
    });

    this.resetQueue();

    let response, failedRecordCount;
    try {
      response = await this._client.send(command);
      failedRecordCount = response['FailedRecordCount']
        ? response['FailedRecordCount']
        : 0;
    } catch (error) {
      logger.error(
        `Failed to putRecords into kinesis stream: ${error.name}: ${error.message}`
      );
      return await this.sendRecords(records, attempt + 1);
    }

    const failedRecords: PutRecordsRequestEntry[] = [];
    if (failedRecordCount > 0) {
      logger.warning('Retrying Failed Records');
      response['Records']?.forEach((record, idx) => {
        if (Object.prototype.hasOwnProperty.call(record, 'ErrorCode')) {
          failedRecords.push(records[idx]);
        }
      });

      return await this.sendRecords(failedRecords, attempt + 1);
    }

    return response['Records'];
  }

  /**
   * Reset the queue.
   * @private
   */
  private resetQueue() {
    this.queue = [];
    this.queueSizeInBytes = 0;
  }

  get client(): KinesisClient {
    return this._client;
  }

  set client(KinesisClient) {
    this._client = KinesisClient;
  }
}
