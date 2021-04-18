import express from 'express';
import { AttendenceController } from '../controllers';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.dirname('uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '--' + file.originalname);
    },
});

const upload = multer({ storage });

export const attendenceRoute = express.Router();

const attendenceController = new AttendenceController();

attendenceRoute.post('/upload', upload.single('file') , attendenceController.createAttendence);
