import { Request, Response } from 'express';
import { EntityRepository, Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';
import { Class } from '../models';

@EntityRepository(Class)
export default class ClassController extends Repository<Class>{
  public getClass = async (req: Request, res: Response) => {
    const teacherId = req.params.teacherId;

    const connection = await PostgresDb.getConnection();
    const classRepository = connection.getRepository(Class);

    let query = classRepository.createQueryBuilder('class');

    if (teacherId) {
      query = query.leftJoin('class.schedules', 'schedule')
      .where('schedule.accountId = :teacherId', { teacherId });
    }
    const allClass = await query.getMany();

    res.status(200).json(allClass);
  }
}

