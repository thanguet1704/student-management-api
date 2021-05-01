import { PrivateControllerMiddleware } from './../middleware/PrivateControllerMiddleware';
import express from 'express';
import multer from 'multer';
import { AttendenceController } from '../controllers';
import { AdminPermissionMiddleware } from './../middleware/AdminPermissionMiddleware';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '--' + file.originalname);
    },
});

const limits = {
    fieldSize: 1024 * 1024 * 10,
};

const upload = multer({ 
    storage, 
    limits,
    fileFilter: (req, file, cb) => {
        const fileTypes = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const mimetype = fileTypes.match(file.mimetype);

        if (mimetype) {
            return cb(null, true);
        }

        cb(new Error('type of file invalid'));
    },
});

export const attendenceRoute = express.Router();

const attendenceController = new AttendenceController();

attendenceRoute.post('/upload', AdminPermissionMiddleware, upload.single('file') , attendenceController.createAttendence);
attendenceRoute.get('/', attendenceController.getAttendences);
attendenceRoute.get('/attendenceStats/:schoolYearId?', PrivateControllerMiddleware, attendenceController.getAttendenceStats);
