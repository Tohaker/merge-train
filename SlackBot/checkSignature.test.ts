import { checkSignature } from './checkSignature';

describe('Check Signature', () => {
  it.each([
    [
      true,
      'v0=49d7610e138f1beea4a93a08f848f98af8349df46cf4e492f25998ca86dd57ca',
    ],
    [false, 'abcd'],
  ])(`should return %b for a signature of %s`, (expected, signature) => {
    process.env.SLACK_SIGNING_SECRET = 'f4f778c2ca9963bb56824f19f0011668';
    const basestring =
      'v0:1612651348:token=MwGfIRz3fLeTUTxFRufk0vlm&team_id=T01HGEUQELQ&team_domain=botplayground-wr11703&channel_id=C01H58M2U65&channel_name=general&user_id=U01GYQ9UGDA&user_name=milesbardon&command=%2Fmerge&text=add+something&api_app_id=A01MYHEM656&is_enterprise_install=false&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT01HGEUQELQ%2F1719677923029%2FlSEcsy0fhHXtoX13fa1vOjHN&trigger_id=1746606817088.1594504830704.ee74c7b3ed734327cd05e1886e2a9f76';

    expect(checkSignature(signature, basestring)).toBe(expected);
  });
});
