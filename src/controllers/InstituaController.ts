import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';
import { Account, Institua } from '../models';

dotenv.config();

export default class InstituaController extends Repository<Account>{
  public getInstituas = async (req: Request, res: Response) => {
    const authorization = req.headers['authorization'];
    const accessToken = authorization?.slice(7);
    
    try {
        const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number; name: string };

        const connection = await PostgresDb.getConnection();
        const accountRepository = connection.getRepository(Account);
      
        const account = await accountRepository.createQueryBuilder('account')
          .where({ id: decoded.id, roleId: 3 })
          .getOne();

        if (!account) {
          return res.status(403).json({ message: 'Permission denied '});
        }

        const instituaRepository = connection.getRepository(Institua);
        const instituas = await instituaRepository.find({ order: {
          name: 'ASC'
        }});

        return res.status(200).json(instituas);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}