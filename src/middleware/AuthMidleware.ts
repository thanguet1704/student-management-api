import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';

export const authMidlerware = async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers['authorization'];
    const accessToken = authorization?.slice(7);
    if (!accessToken) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    try {
        const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number };
        if (decoded) {
            return next();
        } else {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}