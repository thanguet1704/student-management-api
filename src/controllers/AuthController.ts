import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';
import { Account } from '../models';

dotenv.config();

export default class AuthController extends Repository<Account>{
  public auth = async (req: Request, res: Response) => {
    const authorization = req.headers['authorization'];
    const accessToken = authorization?.slice(7);
    
    if (!accessToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
        const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number; name: string };

        if (decoded) {
          const connection = await PostgresDb.getConnection();
          const accountRepository = connection.getRepository(Account);
        
          const account = await accountRepository.createQueryBuilder('account')
            .innerJoinAndSelect('account.role', 'role')
            .where({ id: decoded.id })
            .getOne();

          return res.status(200).json({ isAuth: true, id: decoded.id, name: decoded.name, role: account.role.name });
        }

        return res.status(401).json({ message: 'Unauthorized' });
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
  }
}