import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';
import { IJwtDecoded } from '../interfaces/auth';
import { Account } from '../models';

dotenv.config();

export default class AccountController extends Repository<Account>{
  public updateAcountLogin = async (req: Request, res: Response) => {
    const username = req.body.username;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);

    const account = await accountRepository.findOne({ username });

    if (!account) {
      res.status(500).json({ message: 'Account has not existed' });
    }

    const isLogin = await bcrypt.compare(oldPassword, account.password);
    if (isLogin) {
      const salt = await bcrypt.genSalt(parseInt(process.env.SALT_NUMBER));
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      account.password = hashedPassword;
      accountRepository.save(account);
      res.status(201).json({ message: 'updated' });
    }

    res.status(500).json({ message: 'Account has not existed' });
  } 

  public getAccounts = async (req: Request, res: Response) => {
    const accessToken = req.cookies.hcmaid;
    const decoded = (jwt.verify(accessToken, process.env.SECRET)) as IJwtDecoded;

    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);

    const type = req.params.type as string;
    const classHcma = parseInt((req.query.classId) as string); 
    const search = (req.query.search) as string;
    const skip = req.query.offset ? parseInt((req.query.offset) as string) : 0;
    const take = req.query.limit ? parseInt((req.query.limit) as string) : 10;

    const admin = await this.createQueryBuilder('account')
      .leftJoin('account.role', 'role')
      .where({ id: decoded.id })
      .andWhere(`role.name = 'admin'`)
      .getOne();

    if (!admin) {
      res.status(403).json({ error: 'permission denied' });
    }

    let query = this.createQueryBuilder('account')
      .leftJoin('account.role', 'role')
      .leftJoinAndSelect('account.class', 'class')
      .where('role.name = :type', { type });

    if (classHcma) {
      query = query.andWhere('class.id = :classHcma', { classHcma });
    }

    if (search) {
      query = query.andWhere('LOWER(account.name) like :search', { search: `%${search.toLowerCase().trim()}%` });
    }

    const accounts = await query
      .orderBy('account.isActive', 'DESC')
      .addOrderBy('account.name', 'ASC')
      .skip(skip)
      .take(take)
      .getMany();

    const results = accounts.map(account => ({
      id: account.id,
      name: account.name,
      address: account.address,
      email: account.email,
      phone: account.phone,
      institua: account.attendence,
      class: account.class?.name,
      isActive: account.isActive,
    }));

    res.status(200).json(results);
  }
}
