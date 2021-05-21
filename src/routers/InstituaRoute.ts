import express from 'express';
import { InstituaController } from '../controllers';

export const instituaRoute = express.Router();

const instituaController = new InstituaController();

instituaRoute.get('/', instituaController.getInstituas);
