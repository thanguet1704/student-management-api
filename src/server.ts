import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { LoginController } from './controllers';
import { authMidlerware } from './middleware';
import { studentRouter } from './routers';
import { AuthController } from './controllers';

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

app.use('/student', authMidlerware, studentRouter);


app.listen(3400, () => {
  console.log(`server start on ${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`);
});
