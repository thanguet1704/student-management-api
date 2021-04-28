import express from 'express';
import multer from 'multer';
import { AttendenceController } from '../controllers';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '--' + file.originalname);
    },
});

const upload = multer({ storage });

export const attendenceRoute = express.Router();

const attendenceController = new AttendenceController();

attendenceRoute.post('/upload', upload.single('file') , attendenceController.createAttendence);
