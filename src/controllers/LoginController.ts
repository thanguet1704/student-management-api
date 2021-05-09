import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import PostgresDb from '../common/postgresDb';
import { Account } from '../models';

dotenv.config();

export default class LoginController {
  public login = async (req: Request, res: Response) => {

    try {
      const username = req.body.username;
      const password = req.body.password;

      const connection = await PostgresDb.getConnection();
      const accountRepository = connection.getRepository(Account);

      const account = await accountRepository.createQueryBuilder('account')
        .innerJoinAndSelect('account.role', 'role')
        .where(`account.username = :username`, { username })
        .getOne();

      if (account) {
        const isLogin = await bcrypt.compare(password, account.password);

        if (isLogin) {
          const accessToken = jwt.sign({ id: account.id, name: account.name }, process.env.SECRET, { expiresIn: '30m' });
          res.cookie('hcmaid', accessToken, {
            maxAge: 10 * 30 * 60 * 100,
            // httpOnly: true,
            // secure: true,
          });
          res.cookie('name', account.name, {
          });

          res.cookie('role', account.role.name, {
            maxAge: 10 * 30 * 60 * 100,
          });

          return res.status(200).json({ id: account.id, name: account.name, role: account.role.name ,access_token: accessToken });
        }

        return res.status(400).json({ login: false });
      }

      return res.status(400).json({ login: false });
    } catch (error) {
      return res.status(500).json(error);
    }
  }
}