import express from 'express';
import { UserController } from '../controllers';
import multer from 'multer';

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

userRoute.get('/:type', userController.getUsers);
userRoute.patch('/', userController.updateUser);
userRoute.post('/:type', upload.single('file'), userController.createUsers);
