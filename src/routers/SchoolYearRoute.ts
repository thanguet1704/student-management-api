import express from 'express';
import { SchoolYearController } from '../controllers';

export const schoolYearRoute = express.Router();

const schoolYearController = new SchoolYearController();

schoolYearRoute.get('/', schoolYearController.getSchoolYear);
