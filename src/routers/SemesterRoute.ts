import express from 'express';
import { SemesterController } from '../controllers';

export const semesterRoute = express.Router();

const semesterController = new SemesterController();

semesterRoute.get('/', semesterController.getSemesters);
