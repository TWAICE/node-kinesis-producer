import { KinesisClientConfig } from '@aws-sdk/client-kinesis/KinesisClient';

export interface KinesisRecord {
  Data: Buffer | string;
  PartitionKey?: string;
  ExplicitHashKey?: string;
}

/**
 * streamName: Name of the stream to send the records.
 * clientConfig: Configuration for AWS-SDK Kinesis Client.
 * batchSize: Numbers of records to batch before flushing the queue.
 * batchSizeInBytes: Maximum size in bytes to batch before flushing the queue.
 * batchTime: Maximum of seconds to wait before flushing the queue.
 * maxRetries: Maximum number of times to retry the put operation.
 */
export interface KinesisProducerConfig {
  streamName: string;
  clientConfig?: KinesisClientConfig;
  batchSize?: number;
  batchSizeInBytes?: number;
  batchTime?: number;
  maxRetries?: number;
}
