import express from 'express';
import { ScheduleController } from '../controllers';
import { AdminPermissionMiddleware } from '../middleware';

export const scheduleRoute = express.Router();

const scheduleController = new ScheduleController();

scheduleRoute.post('/', scheduleController.createSchedule);
