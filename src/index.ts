import 'reflect-metadata';
import cors from 'cors';
import express from 'express';
import { getStudents } from './controllers/StudentController';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', async (req, res) => {
  const student = await getStudents();
  console.log(req.headers['authorization']);
  return res.status(200).json(student);
});

app.listen(3400, () => {
  console.log('server start');
});
