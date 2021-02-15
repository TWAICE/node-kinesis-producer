
# NodeJs Kinesis Producer

<p align="center">
  <img width="150" height="150" src="https://i.imgur.com/DzHBVsI.png">
</p>


![npm (scoped)](https://img.shields.io/npm/v/@twaice/node-kinesis-producer)
![CI](https://github.com/TWAICE/node-kinesis-producer/workflows/Build/badge.svg)
![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)
![GitHub](https://img.shields.io/github/license/TWAICE/node-kinesis-producer)

### Description
Kinesis Producer library for NodeJS inspired by [Kiner](https://github.com/bufferapp/kiner).

### Installation
```
$ npm install @twaice/node-kinesis-producer
```

### Usage
```typescript
import KinesisProducer from '@twaice/node-kinesis-producer';

const producer = new KinesisProducer(
    'stream-name', {
        region: 'eu-west-1',
    },
    500,
    1024 * 1024,
    10,
    10
);

const records = [{
    Data: 'test'
}];
await producer.putRecords(records);
```
