import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Account } from '../models';
import PostgresDb from '../common/postgresDb';

export const PrivateControllerMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers['authorization'];
    const accessToken = authorization?.slice(7);
    const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number };

    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);

    const privateAccount = await accountRepository.createQueryBuilder('account')
        .leftJoin('account.role', 'role')
        .where({ id: decoded.id })
        .andWhere('account.roleId != 1')
        .getOne();

    if (privateAccount) {
        return next();
    }

    return res.status(403).json({ error: 'permission denied' });
}