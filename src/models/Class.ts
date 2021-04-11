import {
  BaseEntity, Column, Entity, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import Schedule from './Schedule';

@Entity()
export default class Class extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text')
  name: string

  @Column('varchar', { length: 10 })
  room: string;

  @OneToOne(() => Schedule,
    (schedule) => schedule.class)
  schedule: Schedule;
}
