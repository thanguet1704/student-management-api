import { Request, Response } from 'express';
import { EntityRepository, Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';
import { SchoolYear } from '../models';

@EntityRepository(SchoolYear)
export default class ClassController extends Repository<SchoolYear>{
  public getSchoolYear = async (req: Request, res: Response) => {

    const connection = await PostgresDb.getConnection();
    const schoolYearRepository = connection.getRepository(SchoolYear);

    const allSchoolYear = await schoolYearRepository.createQueryBuilder()
        .getMany();

    return res.status(200).json(allSchoolYear);
  }
}

