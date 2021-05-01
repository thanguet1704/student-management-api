import {
  BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import Account from './Account';
import Institua from './Institua';
import Schedule from './Schedule';
import SchoolYear from './SchoolYear';

@Entity()
export default class Class extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text')
  name: string;

  @Column('int', { name: 'school_year_id' })
  schoolYearId: number;

  @Column('int', { name: 'institua_id' })
  instituaId: number;

  @OneToMany(() => Schedule,
  (schedule) => schedule.class)
  schedules: Schedule[];

  @OneToMany(() => Account,
  account => account.class)
  accounts: Account[];

  @ManyToOne(() => SchoolYear,
  schoolYear => schoolYear.classes)
  @JoinColumn({ name: 'school_year_id', referencedColumnName: 'id' })
  schoolYear: SchoolYear;

  @ManyToOne(() => Institua,
  institua => institua.classes)
  @JoinColumn({ name: 'institua_id', referencedColumnName: 'id' })
  institua: Institua;
}
