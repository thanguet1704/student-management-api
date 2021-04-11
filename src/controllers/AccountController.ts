import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import PostgresDb from '../common/postgresDb';
import { Account } from '../models';

dotenv.config();

export default class AccountController {
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
}
