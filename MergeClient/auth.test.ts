import { HttpRequest } from "@azure/functions";
import { isMessageAuthorized } from "./auth";

describe("isMessageAuthorized", () => {
  const mockRequest = {
    headers: {
      authorization: "HMAC 1234",
    },
    rawBody: JSON.stringify({ text: "some text" }),
  } as unknown as HttpRequest;

  const warnSpy = jest.spyOn(console, "warn").mockImplementation(jest.fn());

  describe("given the webhook token env variable is not set", () => {
    it("should return false and log an error", () => {
      const result = isMessageAuthorized(mockRequest);

      expect(result).toBe(false);
      expect(warnSpy).toBeCalledWith("Webhook token not found");
    });
  });

  describe("given the webhook token env variable is set", () => {
    beforeEach(() => {
      process.env.TEAMS_TOKEN = "1234";
    });

    describe("given the hashes do not match", () => {
      it("should return false", () => {
        const result = isMessageAuthorized(mockRequest);

        expect(result).toBe(false);
      });
    });

    describe("given the hashes match", () => {
      it("should return true", () => {
        mockRequest.headers.authorization =
          "HMAC c99LMYZt6BL67ZRssr72G6w9BnontGBfZzaL29QzzG4=";
        const result = isMessageAuthorized(mockRequest);

        expect(result).toBe(true);
      });
    });
  });
});
