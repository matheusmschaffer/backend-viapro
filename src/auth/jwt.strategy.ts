// backend/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export type JwtPayload = {
  userId: string;
  accountId: string;
  username: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR'; // Tipos de role do seu enum UserRole
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extrai o JWT do cabeçalho "Bearer Token"
      ignoreExpiration: false, // Não ignora a expiração do token
      secretOrKey: configService.get<string>('JWT_SECRET'), // Usa o segredo do .env
    });
  }

  async validate(payload: JwtPayload) {
    // Valida o payload do token
    // Aqui você pode fazer uma busca no banco de dados para garantir que o usuário ainda existe e está ativo.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId, accountId: payload.accountId }, // Buscar pelo ID e accountId para segurança
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Token inválido ou usuário inativo.');
    }

    // Retorna o objeto `user` que será anexado ao `req.user`
    // É importante que o `req.user` contenha as informações necessárias para autorização posterior.
    return {
      userId: user.id,
      accountId: user.accountId,
      username: user.username,
      role: user.role,
    };
  }
}