import express from 'express';
import { ScheduleController } from '../controllers';
import { AdminPermissionMiddleware } from '../middleware';

export const scheduleRoute = express.Router();

const scheduleController = new ScheduleController();

scheduleRoute.post('/', AdminPermissionMiddleware, scheduleController.createSchedule);
scheduleRoute.get('/', scheduleController.getSchedules);