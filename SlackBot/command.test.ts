describe('Parse Command', () => {
  const mockContainer = {};
  const mockItems = [{ url: 'http://url.1' }, { url: 'http://url.2' }];

  const mockConnectToCosmos = jest.fn().mockReturnValue(mockContainer);
  const mockCreateItem = jest.fn();
  const mockDeleteItem = jest.fn();
  const mockReadAllItems = jest.fn();

  const mockRespond = jest.fn();
  const mockSay = jest.fn();

  let parseCommand;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReadAllItems.mockResolvedValue(mockItems);

    jest.mock('./cosmos', () => ({
      connectToCosmos: mockConnectToCosmos,
      createItem: mockCreateItem,
      deleteItem: mockDeleteItem,
      readAllItems: mockReadAllItems,
    }));
    jest.mock('./constants', () => ({
      helpText: 'help',
      invalidCommand: 'invalid',
      addSuccess: (url) => 'add success',
      addError: 'add error',
      nextSuccess: (url) => 'next success',
      listEmpty: 'list empty',
      listSuccess: (list) => 'list success',
      popSuccess: (url) => 'pop success',
      popError: (url) => 'pop error',
      clearError: 'clear error',
      clearSuccess: (list) => 'clear success',
    }));

    parseCommand = require('./command').parseCommand;
  });

  const blocks = (text) => ({
    text: '',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text,
        },
      },
    ],
  });

  const response = (text) => ({
    response_type: 'ephemeral',
    mrkdwn: true,
    text,
  });

  describe('given the add command is sent', () => {
    describe('given the item creation is successful', () => {
      beforeEach(() => {
        mockCreateItem.mockResolvedValueOnce(true);
      });

      it('should send a success message', async () => {
        await parseCommand({
          command: { text: 'add http://some.url' },
          context: { log: jest.fn() },
          respond: mockRespond,
          say: mockSay,
        });

        expect(mockConnectToCosmos).toBeCalled();
        expect(mockCreateItem).toBeCalledWith(mockContainer, 'http://some.url');
        expect(mockSay).toBeCalledWith(blocks('add success'));
        expect(mockRespond).not.toBeCalled();
      });
    });

    describe('given the item creation is not successful', () => {
      beforeEach(() => {
        mockCreateItem.mockRejectedValueOnce(false);
      });

      it('should send an error message', async () => {
        await parseCommand({
          command: { text: 'add http://some.url' },
          context: { log: jest.fn() },
          respond: mockRespond,
          say: mockSay,
        });

        expect(mockConnectToCosmos).toBeCalled();
        expect(mockCreateItem).toBeCalledWith(mockContainer, 'http://some.url');
        expect(mockSay).not.toBeCalled();
        expect(mockRespond).toBeCalledWith(response('add error'));
      });
    });
  });

  describe('given the next command is sent', () => {
    it('should send a message with the first url', async () => {
      await parseCommand({
        command: { text: 'next' },
        context: { log: jest.fn() },
        respond: mockRespond,
        say: mockSay,
      });

      expect(mockConnectToCosmos).toBeCalled();
      expect(mockSay).toBeCalledWith(blocks('next success'));
      expect(mockRespond).not.toBeCalled();
    });
  });
});
