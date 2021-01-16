describe('Parse Command', () => {
  const mockContainer = {};
  const mockItems = [
    { url: 'http://url.1', id: '1' },
    { url: 'http://url.2', id: '2' },
  ];

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
      addSuccess: () => 'add success',
      addError: 'add error',
      nextSuccess: () => 'next success',
      listEmpty: 'list empty',
      listSuccess: () => 'list success',
      unshiftSuccess: () => 'unshift success',
      unshiftError: () => 'unshift error',
      clearError: 'clear error',
      clearSuccess: () => 'clear success',
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

  describe('given the list command is sent', () => {
    it('should send a message with the entire list', async () => {
      await parseCommand({
        command: { text: 'list' },
        context: { log: jest.fn() },
        respond: mockRespond,
        say: mockSay,
      });

      expect(mockConnectToCosmos).toBeCalled();
      expect(mockSay).toBeCalledWith(blocks('list success'));
    });
  });

  describe('given the unshift command is sent', () => {
    describe('given the delete is successful', () => {
      it('should delete the first item', async () => {
        await parseCommand({
          command: { text: 'unshift' },
          context: { log: jest.fn() },
          respond: mockRespond,
          say: mockSay,
        });

        expect(mockDeleteItem).toBeCalledWith(mockContainer, '1');
        expect(mockSay).toBeCalledWith(blocks('unshift success'));
      });
    });

    describe('given the delete is unsuccessful', () => {
      it('should delete the first item', async () => {
        mockDeleteItem.mockRejectedValueOnce(false);
        await parseCommand({
          command: { text: 'unshift' },
          context: { log: jest.fn() },
          respond: mockRespond,
          say: mockSay,
        });

        expect(mockDeleteItem).toBeCalledWith(mockContainer, '1');
        expect(mockRespond).toBeCalledWith(response('unshift error'));
      });
    });
  });

  describe('given the clear command is sent', () => {
    describe('given the delete commands are successful', () => {
      it('should delete all items', async () => {
        await parseCommand({
          command: { text: 'clear' },
          context: { log: jest.fn() },
          respond: mockRespond,
          say: mockSay,
        });

        expect(mockDeleteItem).toBeCalledTimes(2);
        expect(mockDeleteItem).toBeCalledWith(mockContainer, '1');
        expect(mockDeleteItem).toBeCalledWith(mockContainer, '2');
        expect(mockSay).toBeCalledWith(blocks('clear success'));
      });
    });

    describe('given the delete commands are unsuccessful', () => {
      it('should delete all items', async () => {
        mockDeleteItem.mockRejectedValue(false);
        await parseCommand({
          command: { text: 'clear' },
          context: { log: jest.fn() },
          respond: mockRespond,
          say: mockSay,
        });

        expect(mockRespond).toBeCalledWith(response('clear error'));
      });
    });
  });

  describe('given the help command is sent', () => {
    it('should send the ephemeral message', async () => {
      await parseCommand({
        command: { text: 'help' },
        context: { log: jest.fn() },
        respond: mockRespond,
        say: mockSay,
      });

      expect(mockRespond).toBeCalledWith(response('help'));
    });
  });
});
