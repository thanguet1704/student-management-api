import { Request, Response } from 'express';
import { Session } from '../models';
import { EntityRepository, Repository, getRepository } from 'typeorm';
import PostgresDb from '../common/postgresDb';

@EntityRepository(Session)
export default class SessionController extends Repository<Session>{
  public getSessions = async (req: Request, res: Response) => {

    const connection = await PostgresDb.getConnection();
    const sessionRepository = getRepository(Session);
    const sessions = await sessionRepository.createQueryBuilder()
      .select(['id', 'title'])
      .getMany();

    res.status(200).json(sessions);
  }
}