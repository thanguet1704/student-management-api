import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../models";

export const loginMidlleware = async (req: Request, res: Response, next: NextFunction) => {
    const username = req.body.username;
    const password = req.body.password;

    const userRepository = getRepository(User);
    const account = await userRepository.find({ username, password });

    const salt = await bcrypt.genSalt(7);
    console.log(salt);
    // const hash = bcrypt.hash('bacon', 7);
    next();
}