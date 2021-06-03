import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';
import { ICreateScheduleRequest } from '../interfaces/schedule';
import { Account, Schedule, SubjectSchedule } from '../models';

dotenv.config();

export default class ScheduleController extends Repository<Schedule>{
  public createSchedule = async (req: Request, res: Response) => {
    const body: ICreateScheduleRequest = req.body;
    const connection = await PostgresDb.getConnection();
    try {
      if (!body.accountId || !body.categoryId || !body.classId || !body.classroomId
        || !body.sessionId || !body.subjectId) {
          return res.status(400).json({ message: 'invalid param' });
        }
      await connection.manager.transaction(async transactionManager => {
        const schedule = new Schedule();
        schedule.accountId = body.accountId;
        schedule.categoryId = body.categoryId;
        schedule.classId = body.classId;
        schedule.date = body.learningDate;
        schedule.sessionId = body.sessionId;
        schedule.classroomId = body.classroomId;
        schedule.semesterId = body.semesterId;

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
    const startDate = decodeURIComponent(`${req.query.startDate}`);
    const endDate = decodeURIComponent(`${req.query.endDate}`);
    const semesterId = Number(req.query.semesterId);
    const classId = Number(req.query.classId);

    const authorization = req.headers['authorization'];
    const accessToken = authorization?.slice(7);
    const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number };

    const connection = await PostgresDb.getConnection();
    const scheduleRepository = connection.getRepository(Schedule);

    const accountRepo = connection.getRepository(Account);
    const account = await accountRepo.createQueryBuilder('account')
      .innerJoinAndSelect('account.role', 'role')
      .where({ id: decoded.id })
      .getOne();

    if (account.role.name === 'student') {
      let query = scheduleRepository.createQueryBuilder('schedule')
      .innerJoinAndSelect('schedule.category', 'category')
      .innerJoinAndSelect('schedule.classroom', 'classroom')
      .innerJoinAndSelect('schedule.class', 'class')
      .innerJoinAndSelect('schedule.account', 'account')
      .innerJoinAndSelect('schedule.subjectSchedule', 'subjectSchedule')
      .innerJoinAndSelect('category.subject', 'subject')
      .innerJoinAndSelect('schedule.session', 'session')
      .where('class.id = :classId', { classId: account.classId })
      .andWhere('schedule.semesterId = :semesterId', { semesterId });

      if (startDate !== 'undefined' && endDate !== 'undefined') {
        query = query.andWhere('schedule.date > :startDate AND schedule.date < :endDate', { startDate, endDate });
      }

      const schedules = await query.orderBy({ date: 'DESC' }).getMany();

      const result = schedules?.map(schedule => ({
        id: schedule.id,
        subject: schedule.category.subject.name,
        class: schedule.class.name,
        classroom: schedule.classroom.name,
        date: schedule.date,
        session: {
          title: schedule.session.title,
          startTime: schedule.session.startTime,
          endTime: schedule.session.endTime,
        },
        category: schedule.category.title,
        lession: schedule.category.lession,
        teacher: {
          name: schedule.account.name,
          phone: schedule.account.phone,
        },
        startDate: schedule.subjectSchedule.startDate,
        endDate: schedule.subjectSchedule.endDate,
        finalExam: schedule.subjectSchedule.finalExamDate,
      }));

      return res.status(200).json(result);
    }

    let query = scheduleRepository.createQueryBuilder('schedule')
      .innerJoinAndSelect('schedule.category', 'category')
      .innerJoinAndSelect('schedule.classroom', 'classroom')
      .innerJoinAndSelect('schedule.class', 'class')
      .innerJoinAndSelect('schedule.account', 'account')
      .innerJoinAndSelect('schedule.subjectSchedule', 'subjectSchedule')
      .innerJoinAndSelect('category.subject', 'subject')
      .innerJoinAndSelect('schedule.session', 'session')
      .where({ semesterId, classId });

    if (account.role.name === 'teacher') {
      query = query.andWhere('schedule.accountId = :accountId', { accountId: decoded.id });
    }

    if (startDate !== 'undefined' && endDate !== 'undefined') {
      query = query.andWhere('schedule.date >= :startDate AND schedule.date <= :endDate', { startDate, endDate });
    }

    const schedules = await query.orderBy({ date: 'DESC' }).getMany();

    const result = schedules?.map(schedule => ({
      id: schedule.id,
      subject: schedule.category.subject.name,
      class: schedule.class.name,
      classroom: schedule.classroom.name,
      date: schedule.date,
      session: {
        title: schedule.session.title,
        startTime: schedule.session.startTime,
        endTime: schedule.session.endTime,
      },
      category: schedule.category.title,
      lession: schedule.category.lession,
      teacher: {
        name: schedule.account.name,
        phone: schedule.account.phone,
      },
      startDate: schedule.subjectSchedule.startDate,
      endDate: schedule.subjectSchedule.endDate,
      finalExam: schedule.subjectSchedule.finalExamDate,
    }));

    return res.status(200).json(result);
  }
}