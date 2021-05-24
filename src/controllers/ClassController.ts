import { Request, Response } from 'express';
import { EntityRepository, Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';
import { Class, Account } from '../models';
import jwt from 'jsonwebtoken';

@EntityRepository(Class)
export default class ClassController extends Repository<Class>{
  public getClass = async (req: Request, res: Response) => {
    const authorization = req.headers['authorization'];
    const accessToken = authorization?.slice(7);
    
    if (!accessToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number; name: string };
      const connection = await PostgresDb.getConnection();
      const accountRepo = connection.getRepository(Account);

      const account = await accountRepo.createQueryBuilder('account')
        .leftJoinAndSelect('account.role', 'role')
        .where({ id: decoded.id })
        .getOne();
      
      const classRepository = connection.getRepository(Class);
      let query = classRepository.createQueryBuilder('class');

      if (account.role.name === 'teacher') {
        query = query.leftJoin('class.schedules', 'schedule')
          .where('schedule.accountId = :teacherId', { teacherId: account.id });
      }

      const classes = await query.orderBy('class.name', 'ASC').getMany();

      return res.status(200).json(classes);
    } catch (error) {
      return res.status(500).json({ message: 'Unexpect error' });
    }
  }
}

