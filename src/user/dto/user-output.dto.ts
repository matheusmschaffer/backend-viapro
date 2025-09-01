// backend/src/user/interfaces/user-output.interface.ts
import { UserRole } from '@prisma/client';

export interface UserOutput {
  id: string;
  accountId: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
