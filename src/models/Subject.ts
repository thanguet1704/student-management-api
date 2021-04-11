import {
  BaseEntity, Column, Entity, PrimaryGeneratedColumn,
} from 'typeorm';

  @Entity()
export default class Subject extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('text')
    title: string;
}
