import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import PostgresDb from '../common/postgresDb';
import { Account } from '../models';

dotenv.config();

export default class AuthController {
  public auth = async (req: Request, res: Response) => {
    const accessToken = req.cookies.hcmaid;
    
    if (!accessToken) {
        res.status(404).json({ message: 'Unauthorized' });
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
          res.status(200).json({ id: account.id, name: account.name, role: account.role.name, token: accessToken });
        }

        res.status(404).json({ message: 'Unauthorized' });
    } catch (error) {
        res.status(500).json({ message: error });
    }
  }
}