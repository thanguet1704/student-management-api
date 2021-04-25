import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getRepository, Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';
import { IJwtDecoded } from '../interfaces/auth';
import { ICreateScheduleRequest } from '../interfaces/schedule';
import { Account, Category, Class, Schedule, Subject } from '../models';

dotenv.config();

export default class ScheduleController extends Repository<Schedule>{
  public createSchedule = async (req: Request, res: Response) => {
    const body: ICreateScheduleRequest = req.body;
    const accessToken = req.cookies.hcmaid;

    const decoded = (jwt.verify(accessToken, process.env.SECRET)) as IJwtDecoded;

    const accountRepository = getRepository(Account);
    const admin = await accountRepository.createQueryBuilder('admin')
      .innerJoinAndSelect('admin.role', 'role')
      .where({ id: decoded.id })
      .andWhere(`role.name = 'admin'`)
      .getOne();

    if (admin) {
      res.status(403).json({ message: 'permission denied' });
    }

    try {
      const schedule = new Schedule();
      schedule.accountId = body.accountId;
      schedule.categoryId = body.categoryId;
      schedule.classId = body.classId;
      schedule.date = body.date;
      schedule.sessionId = body.sessionId;
      schedule.classroomId = body.classroomId;

      await this.save(schedule);
      res.status(201).json({ message: 'success' });
    } catch (error) {
        res.status(500).json(error);
    }
  }

  public getSubjects = async (req: Request, res: Response) => {
    const connection = await PostgresDb.getConnection();
    const subjectRepository = connection.getRepository(Subject);

    const subjects = await subjectRepository.find();

    const results = subjects.map(subject => ({
      id: subject.id,
      title: subject.title,
    }));

    res.status(200).json(results)
  }

  public getCategoriesBySubject = async (req: Request, res: Response) => {
    const connection = await PostgresDb.getConnection();
    const categoryRepository = connection.getRepository(Category);

    const subjectId = parseInt(req.params.subjectId);
    const categories = await categoryRepository.find({ subjectId });

    const results = categories.map(category => ({
      id: category.id,
      title: category.title,
      lession: category.lession,
    }));

    res.status(200).json(results)
  }

  public getClass = async (req: Request, res: Response) => {
    const connection = await PostgresDb.getConnection();
    const classRepository = connection.getRepository(Class);

    const data = await classRepository.find();

    const results = data.map(item => ({
      id: item.id,
      title: item.name,
    }));

    res.status(200).json(results)
  }

  public getTeachers = async (req: Request, res: Response) => {
    const connection = await PostgresDb.getConnection();
    const teacherRepository = connection.getRepository(Account);

    const data = await teacherRepository.createQueryBuilder('account')
      .leftJoin('account.role', 'role')
      .where(`role.name = 'teacher'`)
      .getMany();

    const results = data.map(item => ({
      id: item.id,
      title: item.name,
    }));

    res.status(200).json(results)
  }
}