import express from 'express';
import multer from 'multer';
import { UserController } from '../controllers';
import { AdminPermissionMiddleware } from '../middleware/AdminPermissionMiddleware';

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

export const userRoute = express.Router();

const userController = new UserController();

userRoute.get('/:type', AdminPermissionMiddleware, userController.getUsers);
userRoute.patch('/', userController.updatePassword);
userRoute.post('/students', AdminPermissionMiddleware, upload.single('file'), userController.createStudents);
userRoute.post('/teachers', AdminPermissionMiddleware, upload.single('file'), userController.createTeachers);
userRoute.post('/student', AdminPermissionMiddleware, userController.createStudent);
userRoute.post('/teacher', AdminPermissionMiddleware, userController.createTeacher);
userRoute.patch('/info', AdminPermissionMiddleware, userController.updateInfo);

