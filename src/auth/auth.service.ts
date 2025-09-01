// backend/src/auth/auth.service.ts
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'; // Importe esta exceção do Prisma

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { companyName, companyCode, email, password, name, username } =
      registerDto;

    const lowerCaseCompanyCode = companyCode.toLowerCase();
    const lowerCaseUsername = username.toLowerCase();

    try {
      const existingCompanyByCode = await this.prisma.account.findUnique({
        where: { companyCode: lowerCaseCompanyCode },
      });
      if (existingCompanyByCode) {
        throw new ConflictException(
          `O código de empresa "${companyCode}" já está em uso. Por favor, escolha outro.`,
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await this.prisma.$transaction(async (prisma) => {
        const account = await prisma.account.create({
          data: {
            companyName,
            companyCode: lowerCaseCompanyCode,
            email,
          },
        });

        const user = await prisma.user.create({
          data: {
            accountId: account.id,
            name,
            username: lowerCaseUsername,
            email,
            passwordHash: hashedPassword,
            role: 'ADMIN',
          },
        });

        return { account, user };
      });

      const jwtPayload = {
        userId: result.user.id,
        accountId: result.account.id,
        username: result.user.username,
        role: result.user.role,
      };
      const accessToken = this.jwtService.sign(jwtPayload);

      return {
        message: 'Conta e usuário administrador criados com sucesso!',
        accessToken,
        account: {
          id: result.account.id,
          companyName: result.account.companyName,
          companyCode: result.account.companyCode,
        },
        user: {
          id: result.user.id,
          name: result.user.name,
          username: result.user.username,
          email: result.user.email,
          role: result.user.role,
        },
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string | string[];

          if (Array.isArray(target)) {
            // NOVO: Adiciona a condição para array com um único elemento 'email'
            if (target.length === 1 && target[0] === 'email') {
              throw new ConflictException(
                'O email informado para a empresa já está em uso.',
              );
            }
            if (target.length === 1 && target[0] === 'company_code') {
              throw new ConflictException(
                'O código da empresa informado já está em uso.',
              );
            }
            if (target.length === 1 && target[0] === 'cnpj') {
              // Se você tiver unique para CNPJ
              throw new ConflictException('O CNPJ informado já está em uso.');
            }

            // Checks para chaves compostas (múltiplos elementos no array)
            if (target.includes('accountId') && target.includes('username')) {
              throw new ConflictException(
                'O nome de usuário já existe para esta empresa.',
              );
            }
            if (target.includes('accountId') && target.includes('email')) {
              throw new ConflictException(
                'O email do usuário já existe para esta empresa.',
              );
            }
            // Adicione outras verificações para @@unique que retornem array
          } else if (typeof target === 'string') {
            // Este bloco agora é mais para casos "legados" ou específicos de como o Prisma retorna
            // Para 'email', 'company_code' e 'cnpj', a condição de array único deve pegar primeiro.
            if (target === 'email') {
              throw new ConflictException(
                'O email informado para a empresa já está em uso.',
              );
            }
            if (target === 'company_code') {
              throw new ConflictException(
                'O código da empresa informado já está em uso.',
              );
            }
            if (target === 'cnpj') {
              throw new ConflictException('O CNPJ informado já está em uso.');
            }
          }

          // Fallback genérico para P2002 se nenhum caso específico foi tratado
          throw new ConflictException(
            'Um conflito de dados foi detectado (valor duplicado). Por favor, verifique os dados de entrada.',
          );
        } else if (error.code === 'P2000') {
          // Exemplo: Dados muito longos para uma coluna VARCHAR
          throw new BadRequestException(
            'O valor fornecido é muito longo ou possui formato inválido para um dos campos.',
          );
        }
        // Adicione outros códigos de erro do Prisma que você queira tratar aqui
      }

      // Se não for um erro do Prisma que tratamos especificamente, relance o erro original.
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { credentials, password } = loginDto;
    const [username, companyCode] = credentials.split('@');

    if (!username || !companyCode) {
      throw new UnauthorizedException(
        'Formato de credenciais inválido. Use usuario@empresa.',
      );
    }

    // 1. Encontrar a conta pelo companyCode
    const account = await this.prisma.account.findUnique({
      where: { companyCode: companyCode.toLowerCase() },
    });

    if (!account) {
      throw new UnauthorizedException('Nome de usuário ou senha inválidos.');
    }

    // 2. Encontrar o usuário específico DENTRO DAQUELA CONTA pelo username
    const user = await this.prisma.user.findUnique({
      where: {
        accountId_username: {
          // Usamos a chave única composta aqui
          accountId: account.id,
          username: username.toLowerCase(),
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Nome de usuário ou senha inválidos.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Nome de usuário ou senha inválidos.');
    }

    const payload = {
      userId: user.id,
      accountId: user.accountId,
      username: user.username,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        companyName: account.companyName,
        companyCode: account.companyCode,
        accountId: account.id,
      },
    };
  }
}
