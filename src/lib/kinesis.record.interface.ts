export interface KinesisRecord {
  Data: Buffer | string;
  PartitionKey?: string;
  ExplicitHashKey?: string;
}
