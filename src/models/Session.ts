import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Schedule from './Schedule';

@Entity()
export default class Session extends BaseEntity{
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text')
  title: string

  @Column('time', { name: 'start_time' })
  startTime: string

  @Column('time', { name: 'end_time' })
  endTime: string

  @OneToMany( () => Schedule,
  schedule => schedule.session)
  schedules: Schedule[];
}
