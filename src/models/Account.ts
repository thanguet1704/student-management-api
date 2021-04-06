import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export default class Account extends BaseEntity{
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column('varchar', { name: 'user_code', length: 10 })
  userCode: string

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

  @Column('varchar', { name: 'role_id', length: 10 })
  roleId: string

  @Column('boolean', { name: 'is_active',  default: true })
  isActive: boolean
}
