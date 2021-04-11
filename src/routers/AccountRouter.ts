import express from 'express';
import { AccountController } from '../controllers';

export const accountRouter = express.Router();

const accountController = new AccountController();

accountRouter.patch('/', accountController.updateAcountLogin);
