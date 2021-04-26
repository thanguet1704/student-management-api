import express from 'express';
import { AccountController } from '../controllers';

export const accountRoute = express.Router();

const accountController = new AccountController();

accountRoute.patch('/', accountController.updateAcountLogin);
accountRoute.get('/:kind', accountController.getAccounts);
