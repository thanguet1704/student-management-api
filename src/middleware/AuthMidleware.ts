import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';

export const authMidlerware = async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.hcmaid;
    if (!accessToken) res.status(404).json({ message: 'Unauthorized' });
    
    try {
        const decoded = jwt.verify(accessToken, process.env.SECRET);

        if (decoded) {
            next();
        } else {
            res.status(400).json({ message: 'Unauthorized' });
        }
    } catch (error) {
        res.status(500).json(error);
    }
}