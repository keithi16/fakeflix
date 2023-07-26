import { getEnv } from '@src/shared/module/config/util/config.util';
import { ZodError } from 'zod';

const withTempNodeEnv = (env: string | undefined, thunk: () => void) => {
  const initialEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = env;
  thunk();
  process.env.NODE_ENV = initialEnv;
};

describe('ConfigUtil', () => {
  describe('getEnv', () => {
    it('returns the NODE_ENV when valid', () => {
      expect(getEnv()).toEqual('test');
    });

    it('throws when NODE_ENV is invalid', () => {
      withTempNodeEnv('UNKNOWN_ENV', () => {
        expect(() => {
          getEnv();
        }).toThrow(ZodError);
      });
    });

    it('throws when NODE_ENV is undefined', () => {
      withTempNodeEnv(undefined, () => {
        expect(() => {
          getEnv();
        }).toThrow(ZodError);
      });
    });
  });
});
