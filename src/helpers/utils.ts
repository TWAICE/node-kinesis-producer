import { KinesisRecord } from '../lib/interfaces';

/**
 * Get the approximate size of record.
 * @param record
 */
export const getRecordSizeInBytes = (record: KinesisRecord): number => {
  let size = 0;
  size += Buffer.byteLength(record.Data, 'utf8');

  if (record.ExplicitHashKey) {
    size += Buffer.byteLength(record.ExplicitHashKey, 'utf8');
  }
  if (record.PartitionKey) {
    size += Buffer.byteLength(record.PartitionKey, 'utf8');
  }
  return size;
};

/**
 * Utility function to delay execution.
 * @param ms: Time to wait in ms.
 */
export const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
