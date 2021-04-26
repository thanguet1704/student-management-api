import express from 'express';
import { SessionController } from '../controllers';

export const sessionRoute = express.Router();

const sessionController = new SessionController();

sessionRoute.get('/', sessionController.getSessions);
