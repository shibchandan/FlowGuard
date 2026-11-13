// src/modules/auth/auth.service.ts
// Authentication business logic.

import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { comparePassword } from '../../shared/utils/hash';
import { JwtPayload } from '../../shared/types';
import { UserRole } from '../../shared/enums';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    name: string | null;
  };
}

export interface MeResult {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role as UserRole,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: user.name,
    },
  };
}

export async function getMe(userId: string): Promise<MeResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return {
    ...user,
    role: user.role as UserRole,
  };
}
