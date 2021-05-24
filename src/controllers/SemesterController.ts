import dotenv from 'dotenv';
import { Request, Response } from 'express';
import Semester from '../models/Semester';
import { Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';

dotenv.config();

export default class SemesterController extends Repository<Semester>{
  public getSemesters = async (req: Request, res: Response) => {
    const connection = await PostgresDb.getConnection();
    const semesterRepo = connection.getRepository(Semester);
    
    const semesters = await semesterRepo.find({
        order: {
          startDate: 'DESC',
        },
    });

    return res.status(200).json(semesters);
  }
}