import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import PostgresDb from '../common/postgresDb';
import { Account } from '../models';
import { StudentRepository } from '../reposiroties';

dotenv.config();

export default class StudentController {
  public getStudents = async () => {
    const connection = await PostgresDb.getConnection();
    const studentRepository = connection.getCustomRepository(StudentRepository);
    const students = await studentRepository.getStudents();
    return students;
  };
}