import express from 'express';
import { authMidlerware } from '../middleware';
import { ScheduleController } from '../controllers';

export const scheduleRoute = express.Router();

const scheduleController = new ScheduleController();

scheduleRoute.post('/', authMidlerware, scheduleController.createSchedule);
scheduleRoute.get('/subjects', authMidlerware, scheduleController.getSubjects);
scheduleRoute.get('/categories/:subjectId', authMidlerware, scheduleController.getCategoriesBySubject);
scheduleRoute.get('/class', authMidlerware, scheduleController.getClass);
scheduleRoute.get('/teachers', authMidlerware, scheduleController.getTeachers);
