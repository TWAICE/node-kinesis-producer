# NodeJs Kinesis Producer

<p align="center">
  <img width="150" height="150" src="https://i.imgur.com/DzHBVsI.png" alt="Logo">
</p>

<p align="center">

<img alt="npm (scoped)" src="https://img.shields.io/npm/v/@twaice/node-kinesis-producer">
<img alt="Github CI" src="https://github.com/TWAICE/node-kinesis-producer/workflows/Build/badge.svg">
<a href="https://codecov.io/gh/TWAICE/node-kinesis-producer">
   <img src="https://codecov.io/gh/TWAICE/node-kinesis-producer/branch/main/graph/badge.svg?token=YDL7IV4MTC"/>
</a>    
<img alt="npm" src="https://img.shields.io/npm/dw/@twaice/node-kinesis-producer">
<img alt="Maintained" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg">
<img alt="License" src="https://img.shields.io/github/license/TWAICE/node-kinesis-producer">

</p>

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
