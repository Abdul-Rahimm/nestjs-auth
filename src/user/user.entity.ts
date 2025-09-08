import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSession } from '../user-session/user-session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => UserSession, (userSession) => userSession.user)
  sessions: UserSession[];
}
