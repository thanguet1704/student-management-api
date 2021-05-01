import { AttendenceStatus } from '../interfaces';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity, JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import Account from './Account';
import Schedule from './Schedule';
  
@Entity()
export default class Attendence extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('int', { name: 'account_id' })
  accountId: number;

  @Column('int', { name: 'schedule_id' })
  scheduleId: number;

  @Column('date')
  public date: string;

  @Column('timestamp with time zone', { name: 'time_in'})
  public timeIn: string;

  @Column('timestamp with time zone', { name: 'time_out'})
  public timeOut: string;

  @Column('enum')
  public status: AttendenceStatus;

  @Column('timestamp with time zone', { name: 'deleted_at', default: null })
  public deletedAt: string;

  @CreateDateColumn({ name: 'created_at' })
  public createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  public updatedAt: string;

  @ManyToOne(() => Schedule,
  (schedule) => schedule.attendences)
  @JoinColumn({ name: 'schedule_id', referencedColumnName: 'id' })
  schedule: Schedule;

  @OneToOne(() => Account,
  (account) => account.attendence)
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account: Account;
}
  