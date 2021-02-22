import { checkSignature } from './checkSignature';

describe('Check Signature', () => {
  it.each([
    [true, '0827039791da268fb12bddcdf284641b10fd0f9b'],
    [false, 'abcd'],
  ])(`should return %b for a signature of %s`, (expected, signature) => {
    process.env.GHAPP_SECRET = '2b1996b82e174b733e17';
    const req = {
      headers: {
        'x-hub-signature': `sha1=${signature}`,
      },
      rawBody: '{body: true}',
    };

    //@ts-ignore
    expect(checkSignature(req)).toBe(expected);
  });
});
