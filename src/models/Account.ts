import {
  BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';
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
  place: string

  @Column('text')
  email: string

  @Column('text')
  phone: string

  @Column('text')
  department: string

  @Column('varchar', { length: 10 })
  class: string

  @Column('varchar', { length: 3 })
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
}
