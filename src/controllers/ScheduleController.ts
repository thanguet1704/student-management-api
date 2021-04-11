import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { IJwtDecoded } from 'src/interfaces/auth';
import { ICreateScheduleRequest } from 'src/interfaces/schedule';
import PostgresDb from '../common/postgresDb';
import { Admin, Schedule } from '../models';

dotenv.config();

export default class ScheduleController {
  public createSchedule = async (req: Request, res: Response) => {
    const body: ICreateScheduleRequest = req.body;
    const accessToken = req.cookies.hcmaid;

    const decoded = (jwt.verify(accessToken, process.env.SECRET)) as IJwtDecoded;

    const connection = await PostgresDb.getConnection();
    const adminRepository = connection.getRepository(Admin);
    const admin = await adminRepository.createQueryBuilder('admin')
      .innerJoinAndSelect('admin.role', 'role')
      .where({ id: decoded.id })
      .getOne();

    if (admin.role.name !== 'admin') {
      res.status(403).json({ message: 'permission denied' });
    }

    const scheduleRepository = connection.getRepository(Schedule);

    const schedule = new Schedule();
    schedule.accountId = body.accountId;
    schedule.categoryId = body.categoryId;
    schedule.classId = body.classId;
    schedule.time = body.time;
    schedule.period = body.period;
    schedule.startDate = body.startDate;
    schedule.endDate = body.endDate;

    try {
        await scheduleRepository.save(schedule);
        res.status(201).json({ message: 'success' });
    } catch (error) {
        res.status(500).json(error);
    }
  }
}