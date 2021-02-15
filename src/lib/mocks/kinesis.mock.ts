export default {
  config: {},
  middlewareStack: {},
  destroy: {},
  send: async () => {
    return {
      FailedRecordCount: 1,
      Records: [
        {
          ErrorCode: '123',
        },
      ],
    };
  },
};
