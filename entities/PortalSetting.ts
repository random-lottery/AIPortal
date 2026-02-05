import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './User';
import type { PortalWidget } from '../src/interfaces/portal';

@Entity('portal_settings')
export class PortalSettingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'userId', unique: true })
  userId!: string;

  @OneToOne(() => UserEntity, (user) => user.portalSetting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column('jsonb', { default: () => "'[]'" })
  layout!: PortalWidget[];

  @Column({ default: 'light' })
  theme!: string;

  @Column({ default: 'en' })
  language!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}

