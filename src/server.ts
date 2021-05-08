import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { AuthController, LoginController } from './controllers';
import { 
  AdminPermissionMiddleware, 
  authMidlerware, 
  PrivateControllerMiddleware 
} from './middleware';
import {
  attendenceRoute, 
  classroomRoute, 
  classRoute,
  scheduleRoute,
  schoolYearRoute, 
  semesterRoute, 
  sessionRoute, 
  subjectRoute,
  userRoute
} from './routers';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: `http://${process.env.CORS_HOST}:${process.env.CORS_PORT}`,
  credentials: true
}));

const loginController = new LoginController();
const authController = new AuthController();
app.post('/login', loginController.login);
app.post('/auth', authController.auth);

app.use('/schedule', authMidlerware, scheduleRoute);
app.use('/attendence', authMidlerware, attendenceRoute);
app.use('/sessions', authMidlerware, sessionRoute);
app.use('/class', authMidlerware, classRoute);
app.use('/schoolYears', authMidlerware, PrivateControllerMiddleware, schoolYearRoute);
app.use('/users', authMidlerware, userRoute);
app.use('/subjects', authMidlerware, AdminPermissionMiddleware, subjectRoute);
app.use('/classrooms', authMidlerware, AdminPermissionMiddleware, classroomRoute);
app.use('/semesters', authMidlerware, semesterRoute);

app.listen(process.env.SERVER_PORT, () => {
  console.log(`server start on ${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`);
});
