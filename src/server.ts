import { schoolYearRoute } from './routers/SchoolYearRoute';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { AuthController, LoginController } from './controllers';
import { authMidlerware } from './middleware';
import { sessionRoute, studentRoute } from './routers';
import { accountRoute } from './routers/AccountRoute';
import { attendenceRoute } from './routers/AttendenceRoute';
import { classRoute } from './routers/ClassRoute';
import { scheduleRoute } from './routers/ScheduleRoute';

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
app.post('/logout', loginController.logout);
app.post('/auth', authController.auth);

app.use('/student', authMidlerware, studentRoute);
app.use('/account', authMidlerware, accountRoute);
app.use('/schedule', authMidlerware, scheduleRoute);
app.use('/attendence', authMidlerware, attendenceRoute);
app.use('/sessions', authMidlerware, sessionRoute);
app.use('/class', authMidlerware, classRoute)
app.use('/schoolYears', authMidlerware, schoolYearRoute)

app.listen(process.env.SERVER_PORT, () => {
  console.log(`server start on ${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`);
});
