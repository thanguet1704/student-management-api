import express from 'express';
import { SubjectController } from '../controllers';

export const subjectRoute = express.Router();

const subjectController = new SubjectController();

subjectRoute.get('/', subjectController.getSubjects);
subjectRoute.get('/:subjectId', subjectController.getCategories);
