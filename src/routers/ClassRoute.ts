import express from 'express';
import { ClassController } from '../controllers';

export const classRoute = express.Router();

const classController = new ClassController();

classRoute.get('/:teacherId?', classController.getClass);
