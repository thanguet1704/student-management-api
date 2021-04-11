import {
  BaseEntity, Column, Entity, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import Schedule from './Schedule';

  @Entity()
export default class Category extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text')
  title: string

  @Column('int', { name: 'subject_id' })
  subjectId: number;

  @OneToOne(() => Schedule,
    (schedule) => schedule.category)
  schedule: Schedule;
}
