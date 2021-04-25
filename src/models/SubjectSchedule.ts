import {
  BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn
} from 'typeorm';
import Subject from './Subject';
import Schedule from './Schedule';
  
  @Entity()
  export default class SubjectSchedule extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column('int', { name: 'subject_id' })
    subjectId: string;

    @Column('int', { name: 'schedule_id' })
    scheduleId: string;

    @Column('date', { name: 'start_date' })
    startDate: string;

    @Column('date', { name: 'end_date' })
    endDate: string;

    @Column('timestamp with time zone', { name: 'final_exam_date' })
    finalExamDate: string;
  
    @OneToMany(() => Schedule,
    (schedule) => schedule.subjectSchedule)
    @JoinColumn({ name: 'schedule_id', referencedColumnName: 'id' })
    schedules: Schedule[];

    @ManyToOne(() => Subject,
    (subject) => subject.subjectSchedules)
    @JoinColumn({ name: 'subject_id', referencedColumnName: 'id' })
    subject: Subject;
  }
