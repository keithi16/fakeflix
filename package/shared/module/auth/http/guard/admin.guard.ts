import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly clsService: ClsService) {}

  canActivate(_context: ExecutionContext): boolean {
    const role = this.clsService.get<string | null>('userRole');
    if (role !== 'admin') throw new ForbiddenException();
    return true;
  }
}
