import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
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

        return res.status(201).json({ message: 'success' });
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  public getSchedules = async (req: Request, res: Response) => {
    const authorization = req.headers['authorization'];
    const accessToken = authorization?.slice(7);
    const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number };

    const connection = await PostgresDb.getConnection();
    const scheduleRepository = connection.getRepository(Schedule);

    const schedules = await scheduleRepository.createQueryBuilder('schedule')
      .innerJoinAndSelect('schedule.category', 'category')
      .innerJoinAndSelect('schedule.classroom', 'classroom')
      .innerJoinAndSelect('schedule.class', 'class')
      .innerJoinAndSelect('schedule.account', 'account')
      .innerJoinAndSelect('schedule.subjectSchedule', 'subjectSchedule')
      .innerJoinAndSelect('category.subject', 'subject')
      .innerJoinAndSelect('schedule.session', 'session')
      .innerJoin('class.accounts', 'accounts')
      .where('accounts.id = :accountId', { accountId: decoded.id })
      .getMany();

    const result = schedules?.map(schedule => ({
      subject: schedule.category.subject.name,
      class: schedule.class.name,
      classroom: schedule.classroom.name,
      date: schedule.date,
      session: schedule.session.title,
      category: schedule.category.title,
      lession: schedule.category.lession,
      teacher: {
        name: schedule.account.name,
        phone: schedule.account.phone,
      },
    }));

    return res.status(200).json(result);
  }
}