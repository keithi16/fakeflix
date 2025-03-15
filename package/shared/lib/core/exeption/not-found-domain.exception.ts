import { DomainException } from '@tlc/shared-lib/core/exeption/domain.exception';

export class NotFoundDomainException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
