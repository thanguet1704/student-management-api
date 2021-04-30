import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Account } from '../models';
import PostgresDb from '../common/postgresDb';

export const AdminPermissionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers['authorization'];
    const accessToken = authorization.slice(7);
    
    const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number, name: string };

    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);

    const admin = await accountRepository.createQueryBuilder('account')
        .leftJoin('account.role', 'role')
        .where({ id: decoded.id })
        .andWhere('role.name = :admin', { admin: 'admin' })
        .getOne();

    if (admin) {
        next();
    }

    res.status(403).json({ error: 'permission denied' });
}