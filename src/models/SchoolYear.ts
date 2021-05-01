import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Account from './Account';
import Class from './Class';

@Entity()
export default class SchoolYear extends BaseEntity{
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text')
  name: string

  @OneToMany( () => Account,
  account => account.schoolYear)
  accounts: Account[];

  @OneToMany( () => Class,
  classes => classes.schoolYear)
  classes: Class[];
}
