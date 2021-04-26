import {
  BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import Attendence from './Attendence';
import Class from './Class';
import Institua from './Institua';
import Role from './Role';
import Schedule from './Schedule';
import SchoolYear from './SchoolYear';

@Entity()
export default class Account extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('varchar', { length: 36 })
  username: string

  @Column('varchar', { select: false })
  password: string

  @Column('text')
  name: string

  @Column('text')
  address: string

  @Column('text')
  email: string

  @Column('text')
  phone: string

  @Column('int', { name: 'institua_id' })
  institua_id: number;

  @Column('int', { name: 'class_id' })
  classId: number

  @Column('int', { name: 'school_year_id' })
  schoolYearId: number;

  @Column('int', { name: 'role_id', select: false })
  roleId: number

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean

  @ManyToOne(() => Role,
    (role) => role.accounts)
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role: Role;

  @OneToMany(() => Schedule,
    (schedule) => schedule.accounts)
  schedule: Schedule;

  @ManyToOne(() => Class,
    classHcma => classHcma.accounts)
  @JoinColumn({ name: 'class_id', referencedColumnName: 'id' })
  class: Class;

  @ManyToOne(() => SchoolYear,
    schoolYear => schoolYear.accounts)
  @JoinColumn({ name: 'school_year_id', referencedColumnName: 'id' })
  schoolYear: SchoolYear;

  @ManyToOne(() => Institua,
    institua => institua.accounts)
  @JoinColumn({ name: 'institua_id', referencedColumnName: 'id' })
  institua: Institua;

  @OneToOne( () => Attendence,
  attendence => attendence.account)
  attendence: Attendence;
}
