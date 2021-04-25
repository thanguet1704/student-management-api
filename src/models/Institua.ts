import {
  BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn
} from 'typeorm';
import Account from './Account';
  
  @Entity()
  export default class Institua extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column('text')
    name: string;
  
    @OneToMany(() => Account,
    account => account.institua)
    accounts: Account;
  }
  