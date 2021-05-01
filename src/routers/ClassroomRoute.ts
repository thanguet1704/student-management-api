import express from 'express';
import { ClassroomController } from '../controllers';

export const classroomRoute = express.Router();

const classroomController = new ClassroomController();

classroomRoute.get('/', classroomController.getClassrooms);
classroomRoute.get('/:classroomId/cameras', classroomController.getCameras);
