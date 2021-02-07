import { AzureFunction, Context, HttpRequest } from '@azure/functions';

describe('HTTP Trigger', () => {
  let httpTrigger: AzureFunction;

  const mockContext: Context = {
    bindings: {},
    bindingData: {},
    bindingDefinitions: [],
    invocationId: '123',
    executionContext: {
      invocationId: '123',
      functionName: 'mock function',
      functionDirectory: 'dist',
    },
    log: (function () {
      let main = <any>jest.fn((message) => message);

      let info = jest.fn((message) => message);
      main.info = info;

      return main;
    })(),
    traceContext: {
      attributes: {},
      traceparent: 'parent',
      tracestate: 'state',
    },
    done: jest.fn(),
  };

  let command = 'merge';
  let text = 'add something';

  const mockRequest: HttpRequest = {
    method: 'POST',
    url: 'http://fake.url',
    headers: {
      'x-slack-signature': 'signature',
      'x-slack-request-timestamp': '1234',
    },
    query: {},
    params: {},
    body: `response_url=http://response.url&command=%2F${command}&text=${text}`,
    rawBody: `response_url=http://response.url&command=%2F${command}&text=${text}`,
  };

  const mockCheckSignature = jest.fn(() => true);
  const mockParseCommand = jest.fn();

  beforeEach(() => {
    jest.mock('./command', () => ({
      parseCommand: mockParseCommand,
    }));
    jest.mock('./checkSignature', () => ({
      checkSignature: mockCheckSignature,
    }));
    httpTrigger = require('.').default;
  });

  describe('given the trigger is invoked', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('given the signature does not match', () => {
      beforeEach(() => {
        mockCheckSignature.mockReturnValue(false);
      });

      it('should return early', async () => {
        await httpTrigger(mockContext, mockRequest);

        expect(mockParseCommand).not.toBeCalled();
        expect(mockContext.done).toBeCalledWith(null, { status: 401 });
      });
    });

    describe('given the signature matches', () => {
      beforeEach(() => {
        mockCheckSignature.mockReturnValue(true);
      });

      describe('given the /merge command is sent', () => {
        it('should call parseCommand', async () => {
          await httpTrigger(mockContext, mockRequest);
          expect(mockParseCommand).toBeCalledWith({
            text,
            context: mockContext,
            respond: expect.any(Function),
          });
          expect(mockContext.done).toBeCalledWith(null, { status: 200 });
        });
      });
    });
  });
});
