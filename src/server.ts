import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { StudentController } from './controllers';
import { LoginController } from './controllers';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: `http://${process.env.CORS_HOST}:${process.env.CORS_PORT}`,
  credentials: true
}));

const studentController = new StudentController();
const loginController = new LoginController();

app.post('/login', loginController.login);

app.listen(3400, () => {
  console.log(`server start on ${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`);
});
