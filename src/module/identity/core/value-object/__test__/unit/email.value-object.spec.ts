import { Email } from '@src/module/identity/core/value-object/email.value-object';

describe('Email', () => {
  describe('constructor', () => {
    it('creates an instance of Email with a valid email address', () => {
      const email = new Email('test@example.com');
      expect(email).toBeInstanceOf(Email);
      expect(email.getValue()).toBe('test@example.com');
    });

    it('throws an error with an invalid email address', () => {
      expect(() => new Email('invalid-email')).toThrow('Invalid email address');
    });
  });
});
