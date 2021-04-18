import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Account from './Account';
import Attendence from './Attendence';
import Category from './Category';
import Class from './Class';

@Entity()
export default class Schedule extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('int', { name: 'category_id' })
  categoryId: number;

  @Column('int', { name: 'class_id' })
  classId: number;

  @Column('timestamp with time zone')
  date: Date;

  @Column('enum')
  session: 'morning' | 'afternoon';

  @Column('int', { name: 'account_id' })
  accountId: number;

  @Column('timestamp with time zone', { name: 'start_date'})
  public startDate: Date;

  @Column('timestamp with time zone', { name: 'end_date'})
  public endDate: Date;

  @Column('timestamp with time zone', { name: 'start_session'})
  public startSession: Date;

  @Column('timestamp with time zone', { name: 'end_session'})
  public endSession: Date;

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

  @OneToOne(() => Class,
  (classmodel) => classmodel.schedule)
  @JoinColumn({ name: 'class_id', referencedColumnName: 'id' })
  class: Class;

  @OneToOne(() => Account,
  (account) => account.schedule)
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account: Account;

  @OneToMany( () => Attendence,
  attendence => attendence.schedule)
  attendences: Attendence[];
}
