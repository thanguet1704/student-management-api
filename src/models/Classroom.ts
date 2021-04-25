import {
    BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn
} from 'typeorm';
import Schedule from './Schedule';
  
  @Entity()
  export default class Classroom extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column('text')
    name: string;

    @Column('text', { name: 'camera_id' })
    cameraId: string[];
  
    @OneToMany(() => Schedule,
    (schedule) => schedule.classroom)
    schedules: Schedule[];
  }
  