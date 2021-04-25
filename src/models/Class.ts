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

  @OneToMany(() => Schedule,
  (schedule) => schedule.class)
  schedules: Schedule[];

  @OneToMany(() => Account,
  account => account.class)
  accounts: Account[];
}
