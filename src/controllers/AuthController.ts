import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

dotenv.config();

export default class AuthController {
  public auth = (req: Request, res: Response) => {
    const accessToken = req.cookies.hcmaid;
    
    if (!accessToken) {
        res.status(404).json({ message: 'Unauthorized' });
    }
    
    try {
        const decoded = jwt.verify(accessToken, process.env.SECRET);
        console.log(typeof decoded);
        if (typeof decoded === 'object') {
            res.status(200).json({ isAuth: true });
        }

        res.status(404).json({ message: 'Unauthorized' });
    } catch (error) {
        res.status(404).json({ message: 'Unauthorized' });
    }
  }
}