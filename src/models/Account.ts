import {
  BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import Admin from './Admin';
import Attendence from './Attendence';
import Class from './Class';
import Role from './Role';
import Schedule from './Schedule';

@Entity()
export default class Account extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text')
  username: string

  @Column('varchar')
  password: string

  @Column('text')
  name: string

  @Column('text')
  address: string

  @Column('text')
  email: string

  @Column('text')
  phone: string

  @Column('int')
  institua: number;

  @Column('int', { name: 'admin_id' })
  adminId: number

  @Column('varchar', { name: 'class_id' })
  classId: number

  @Column('varchar', { length: 10 })
  year: string

  @Column('int', { name: 'role_id' })
  roleId: number

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean

  @ManyToOne(() => Role,
    (role) => role.accounts)
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role: Role;

  @OneToOne(() => Schedule,
    (schedule) => schedule.account)
  schedule: Schedule;

  @ManyToOne(() => Admin,
    admin => admin.accounts)
  @JoinColumn({ name: 'admin_id', referencedColumnName: 'id' })
  admin: Admin;

  @ManyToOne(() => Class,
    classHcma => classHcma.accounts)
  @JoinColumn({ name: 'class_id', referencedColumnName: 'id' })
  class: Class;

  @OneToOne( () => Attendence,
  attendence => attendence.account)
  attendence: Attendence;
}
