import {
    BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn
} from 'typeorm';
import Account from './Account';
import Role from './Role';
  
  @Entity()
  export default class Admin extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column('text')
    name: string
  
    @Column('text')
    username: string

    @Column('text')
    password: string

    @Column('int', { name: 'role_id' })
    roleId: number
  
    @OneToMany(() => Account,
    account => account.admin)
    accounts: Account[];

    @ManyToOne(() => Role,
    role => role.admins)
    @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
    role: Role;
  }
  