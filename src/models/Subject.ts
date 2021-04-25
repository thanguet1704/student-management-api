import {
  BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn
} from 'typeorm';
import Category from './Category';
import SubjectSchedule from './SubjectSchedule';

  @Entity()
export default class Subject extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('text')
    title: string;

    @OneToMany(() => SubjectSchedule,
    (subjectSchedule) => subjectSchedule.subject)
    subjectSchedules: SubjectSchedule[];

    @OneToMany(() => Category,
    (category) => category.subject)
    categories: Category[];
}
