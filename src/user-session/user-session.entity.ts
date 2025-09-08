import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum SessionAction {
  SIGNIN = 'signin',
  SIGNOUT = 'signout',
}

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: SessionAction,
  })
  action: SessionAction;

  @CreateDateColumn()
  timestamp: Date;
}
