import winston, { transports } from 'winston';

import { KinesisRecord } from '../lib/interfaces';

/**
 * Winston Logger.
 */
export const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  format: winston.format.json(),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'CI') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

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
