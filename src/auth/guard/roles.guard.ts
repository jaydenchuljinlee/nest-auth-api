import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // const user = context.switchToHttp().getRequest().user;
    // return user?.role === 'admin';
    const required = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true; // 역할 미지정 = 모두 허용

    const { user } = context.switchToHttp().getRequest();
    const has = user?.roles?.some((r) => required.includes(r));
    
    if (!has) throw new ForbiddenException('권한이 없습니다.');
    return true;
  }
}