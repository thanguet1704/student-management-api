import {
  BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn
} from 'typeorm';
import Account from './Account';
import Class from './Class';
  
  @Entity()
  export default class Institua extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column('text')
    name: string;
  
    @OneToMany(() => Account,
    account => account.institua)
    accounts: Account[];

    @OneToMany(() => Class,
    classes => classes.institua)
    classes: Class[];
  }
  