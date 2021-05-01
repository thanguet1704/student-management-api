import { Request, Response } from 'express';
import { EntityRepository, Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';
import { Classroom } from '../models';

@EntityRepository(Classroom)
export default class ClassroomController extends Repository<Classroom>{
  public getClassrooms = async (req: Request, res: Response) => {
    const connection = await PostgresDb.getConnection();
    const classroomRepository = connection.getRepository(Classroom);

    const classrooms = (await classroomRepository.find());

    const result = classrooms.map(classroom => ({
        id: classroom.id,
        name: classroom.name,
    }));

    return res.status(200).json(result);
  }

  public getCameras = async (req: Request, res: Response) => {
    const classroomId = Number(req.params.classroomId);
    const connection = await PostgresDb.getConnection();
    const classroomRepository = connection.getRepository(Classroom);

    const classroom = (await classroomRepository.findOne({ id: classroomId }));

    const result = classroom.cameraId;
    
    return res.status(200).json(result);
  }
}

