# NodeJs Kinesis Producer

<p style="text-align: center">
  <img width="150" height="150" src="https://i.imgur.com/DzHBVsI.png" alt="Logo">
</p>

<div style="text-align: center;">

![npm (scoped)](https://img.shields.io/npm/v/@twaice/node-kinesis-producer)
![CI](https://github.com/TWAICE/node-kinesis-producer/workflows/Build/badge.svg)
[![codecov](https://codecov.io/gh/TWAICE/node-kinesis-producer/branch/main/graph/badge.svg?token=YDL7IV4MTC)](https://codecov.io/gh/TWAICE/node-kinesis-producer)
![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)
![GitHub](https://img.shields.io/github/license/TWAICE/node-kinesis-producer)

</div>

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
    streamName: "stream-name",
    clientConfig: {
        region: "eu-west-1"
    },
    maxRetries: 10
);

const records = [{
    Data: 'test'
}];
await producer.putRecords(records);
```
