import express from 'express';
import { authMidlerware } from '../middleware';
import { ScheduleController } from '../controllers';

export const scheduleRoute = express.Router();

const scheduleController = new ScheduleController();

scheduleRoute.post('/', authMidlerware, scheduleController.createSchedule);
