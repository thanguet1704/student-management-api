import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import Account from './Account';
import Attendence from './Attendence';
import Category from './Category';
import Class from './Class';
import Classroom from './Classroom';
import Session from './Session';
import SubjectSchedule from './SubjectSchedule';

@Entity()
export default class Schedule extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('int', { name: 'category_id' })
  categoryId: number;

  @Column('int', { name: 'class_id' })
  classId: number;

  @Column('int', { name: 'classroom_id' })
  classroomId: number;

  @Column('timestamp with time zone')
  date: Date;

  @Column('int', { name: 'session_id' })
  sessionId: number;

  @Column('int', { name: 'account_id' })
  accountId: number;

  @Column('timestamp with time zone', { name: 'deleted_at', default: null })
  public deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  public updatedAt: Date;

  @OneToOne(() => Category,
  (category) => category.schedule)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: Category;

  @ManyToOne(() => Class,
  (classmodel) => classmodel.schedules)
  @JoinColumn({ name: 'class_id', referencedColumnName: 'id' })
  class: Class;

  @OneToMany(() => Account,
  (account) => account.schedule)
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  accounts: Account[];

  @ManyToOne(() => Classroom,
  (classroom) => classroom.schedules)
  @JoinColumn({ name: 'classroom_id', referencedColumnName: 'id' })
  classroom: Classroom;

  @ManyToOne(() => Session,
  (session) => session.schedules)
  @JoinColumn({ name: 'session_id', referencedColumnName: 'id' })
  session: Session;

  @ManyToOne(() => SubjectSchedule,
  (subjectSchedule) => subjectSchedule.schedules)
  subjectSchedule: SubjectSchedule;

  @OneToMany( () => Attendence,
  (attendence) => attendence.schedule)
  attendences: Attendence[];
}
