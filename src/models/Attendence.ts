import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import Account from './Account';
  import Category from './Category';
  import Class from './Class';
import Schedule from './Schedule';
  
  @Entity()
  export default class Attendence extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column('int', { name: 'schedule_id' })
    scheduleId: number;
  
    @Column('int', { name: 'student_id' })
    studentId: number;

    @Column('timestamp with time zone', { name: 'time_in'})
    public timeIn: Date;

    @Column('timestamp with time zone', { name: 'time_out'})
    public timeOut: Date;

    @Column('timestamp with time zone', { name: 'deleted_at', default: null })
    public deletedAt: Date;
  
    @CreateDateColumn({ name: 'created_at' })
    public createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    public updatedAt: Date;
  
    @ManyToOne(() => Schedule,
    (schedule) => schedule.attendences)
    @JoinColumn({ name: 'schedule_id', referencedColumnName: 'id' })
    schedule: Schedule;
  
    @OneToOne(() => Account,
    (account) => account.attendence)
    @JoinColumn({ name: 'student_id', referencedColumnName: 'id' })
    account: Account;
  }
  