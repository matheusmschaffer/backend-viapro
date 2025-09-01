// backend/src/auth/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client'; // Importe o ENUM UserRole do Prisma
import { ROLES_KEY } from './roles.decorator'; // Importe a chave do decorator

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Pega as roles necessárias para esta rota do decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se nenhuma role for especificada, a rota é acessível por qualquer usuário autenticado.
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Se não houver usuário autenticado, nega acesso. (Já deve ser coberto pelo AuthGuard antes)
    if (!user) {
      throw new ForbiddenException('Acesso negado. Usuário não autenticado.');
    }

    // Verifica se a role do usuário está entre as roles permitidas.
    // Também valida a hierarquia de roles (ADMIN inclui MANAGER e OPERATOR, MANAGER inclui OPERATOR).
    const hasPermission = requiredRoles.some((requiredRole) => {
      // Se a role do usuário for ADMIN, ele tem permissão para qualquer requiredRole.
      if (user.role === UserRole.ADMIN) {
        return true;
      }
      // Se a role do usuário for MANAGER, ele tem permissão para MANAGER e OPERATOR.
      // Então, se a requiredRole for MANAGER ou OPERATOR, e o user.role for MANAGER, permite.
      if (
        user.role === UserRole.MANAGER &&
        (requiredRole === UserRole.MANAGER ||
          requiredRole === UserRole.OPERATOR)
      ) {
        return true;
      }
      // Se a role do usuário for OPERATOR, ele tem permissão apenas para OPERATOR.
      if (
        user.role === UserRole.OPERATOR &&
        requiredRole === UserRole.OPERATOR
      ) {
        return true;
      }
      return false;
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar esta funcionalidade.',
      );
    }

    return true;
  }
}
