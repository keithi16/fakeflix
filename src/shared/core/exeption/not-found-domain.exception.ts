import { DomainException } from '@src/shared/core/exeption/domain.exception';

export class NotFoundDomainException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
