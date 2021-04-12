import {
  BaseEntity, Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import Account from './Account';
import Schedule from './Schedule';

@Entity()
export default class Class extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text')
  name: string;

  @Column('text', { name: 'camera_id' })
  cameraId: string[];

  @Column('varchar', { length: 10 })
  room: string;

  @OneToOne(() => Schedule,
  (schedule) => schedule.class)
  schedule: Schedule;

  @OneToMany(() => Account,
  account => account.class)
  accounts: Account;
}
