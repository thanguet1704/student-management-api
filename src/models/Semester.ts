import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Schedule from './Schedule';

@Entity()
export default class Semester extends BaseEntity{
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text')
  name: string

  @Column('timestamp with time zone', { name: 'start_date'})
  startDate: string;

  @Column('timestamp with time zone', { name: 'end_date'})
  endDate: string;

  @OneToMany(() => Schedule,
  schedule => schedule.semester)
  schedules: Schedule[];
}
