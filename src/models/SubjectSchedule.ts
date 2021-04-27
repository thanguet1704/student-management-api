import {
  BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn
} from 'typeorm';
import Schedule from './Schedule';
import Subject from './Subject';
  
  @Entity('subject_schedule')
  export default class SubjectSchedule extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column('int', { name: 'subject_id' })
    subjectId: number;

    @Column('int', { name: 'schedule_id' })
    scheduleId: number;

    @Column('date', { name: 'start_date' })
    startDate: Date;

    @Column('date', { name: 'end_date' })
    endDate: Date;

    @Column('timestamp with time zone', { name: 'final_exam_date' })
    finalExamDate: Date;
  
    @OneToOne(() => Schedule,
    (schedule) => schedule.subjectSchedule)
    @JoinColumn({ name: 'schedule_id', referencedColumnName: 'id' })
    schedules: Schedule[];

    @ManyToOne(() => Subject,
    (subject) => subject.subjectSchedules)
    @JoinColumn({ name: 'subject_id', referencedColumnName: 'id' })
    subject: Subject;
  }
