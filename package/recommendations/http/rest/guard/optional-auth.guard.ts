import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '@tlc/shared-module/auth';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly clsService: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync<{ sub: string; role?: string }>(token, {
          secret: jwtConstants.secret,
          algorithms: ['HS256'],
        });
        this.clsService.set('userId', payload.sub);
        this.clsService.set('userRole', payload.role ?? null);
      } catch {
        // Invalid token — treat as anonymous
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.get('Authorization')?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
