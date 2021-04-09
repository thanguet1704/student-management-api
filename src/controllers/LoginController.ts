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

      const account = await accountRepository.findOne({ userCode: username });

      if (account) {
        const isLogin = await bcrypt.compare(password, account.password);

        if (isLogin) {

          const accessToken = jwt.sign({ id: account.id, username }, process.env.SECRET);
          res.cookie('hcmaid', accessToken, {
            maxAge: 365 * 24 * 60 * 60 * 100,
            httpOnly: true,
            // secure: true,
          });

          res.setHeader('X-HCMA-Id', accessToken);

          res.status(200).json({ id: account.id, name: account.name });
        }

        res.status(400).json({ login: false });
      } else {
        res.status(400).json({ login: false });
      }
    } catch (error) {
      res.status(500).json(error);
    }
  }
}