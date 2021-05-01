import { Request, Response } from 'express';
import { Session } from '../models';
import { EntityRepository, Repository, getRepository } from 'typeorm';
import PostgresDb from '../common/postgresDb';

@EntityRepository(Session)
export default class SessionController extends Repository<Session>{
  public getSessions = async (req: Request, res: Response) => {

    const connection = await PostgresDb.getConnection();
    const sessionRepository = connection.getRepository(Session);
    const sessions = await sessionRepository.createQueryBuilder()
      .getMany();

    return res.status(200).json(sessions);
  }
}