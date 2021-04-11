import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Account from './Account';
import Admin from './Admin';

@Entity()
export default class Role extends BaseEntity{
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text')
  name: string

  @Column('text')
  ability: string[]

  @OneToMany( () => Account,
  account => account.role)
  accounts: Account[];

  @OneToMany( () => Admin,
  admin => admin.role)
  admins: Admin[];
}
