import express from 'express';
import { UserController } from '../controllers';

export const userRoute = express.Router();

const userController = new UserController();

userRoute.get('/:type', userController.getUsers);
