import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';
import { ICreateScheduleRequest } from '../interfaces/schedule';
import { Schedule, SubjectSchedule } from '../models';

dotenv.config();

export default class ScheduleController extends Repository<Schedule>{
  public createSchedule = async (req: Request, res: Response) => {
    const body: ICreateScheduleRequest = req.body;
    const connection = await PostgresDb.getConnection();
    try {
      await connection.manager.transaction(async transactionManager => {
        const schedule = new Schedule();
        schedule.accountId = body.accountId;
        schedule.categoryId = body.categoryId;
        schedule.classId = body.classId;
        schedule.date = body.learningDate;
        schedule.sessionId = body.sessionId;
        schedule.classroomId = body.classroomId;

        const createdSchedule = await transactionManager.save(schedule);

        const subjectSchedule = new SubjectSchedule();
        subjectSchedule.subjectId = body.subjectId;
        subjectSchedule.scheduleId = createdSchedule.id;
        subjectSchedule.startDate = body.startDate;
        subjectSchedule.endDate = body.endDate;
        subjectSchedule.finalExamDate = body.finalExamDate;

        await transactionManager.save(subjectSchedule);

        res.status(201).json({ message: 'success' });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}