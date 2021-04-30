import Subject from './Subject';
import {
  BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn
} from 'typeorm';
import Schedule from './Schedule';

@Entity()
export default class Category extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text')
  title: string

  @Column('int')
  lession: number;

  @Column('int', { name: 'subject_id' })
  subjectId: number;

  @OneToMany(() => Schedule,
  (schedule) => schedule.category)
  schedules: Schedule[];

  @ManyToOne(() => Subject,
  (subject) => subject.categories)
  @JoinColumn({ name: 'subject_id', referencedColumnName: 'id' })
  subject: Subject;
}
