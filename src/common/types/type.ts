import { User } from '../../users/entities/user.entity';

export type IRequest = Request & {
  session: Record<any, any>;
  user: Partial<User>;
};
