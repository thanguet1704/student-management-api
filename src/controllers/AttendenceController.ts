import Bluebird from 'bluebird';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { get } from 'lodash';
import moment from 'moment';
import { EntityRepository, Repository } from 'typeorm';
import xlsx from 'xlsx';
import PostgresDb from '../common/postgresDb';
import Attendence from '../models/Attendence';
import fs from 'fs';
import { Account, Category, Class, Classroom, Schedule } from '../models';

@EntityRepository(Attendence)
export default class AttendenceController extends Repository<Attendence>{
  public createAttendence = async (req: Request, res: Response) => {
    const file = xlsx.readFile(req.file.path, { cellDates: true, cellStyles: true });
    const file1 = file.Sheets[file.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(file1);
    const connection = await PostgresDb.getConnection();

    try {

      const authorization = req.headers['authorization'];
      const accessToken = authorization.slice(7);
      const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number };

      await connection.manager.transaction(async transactionManager => {
        return await Bluebird.map(data, async (attendence: any) => {
          const accountRepository = connection.getRepository(Account);
          const student = await accountRepository.findOne({ username: attendence['MSV'], name: attendence['Họ và tên'] });

          if (!student) {
            res.status(400).json({ message: 'Invalid student' });
          }

          const categoryRepository = connection.getRepository(Category);
          const category = await categoryRepository.findOne({ title: attendence['Chuyên đề'] });

          if (!category) {
            res.status(400).json({ message: 'Invalid category' });
          }

          const classRository = connection.getRepository(Class);
          const classSchool = await classRository.findOne({ name: attendence['Lớp'] });

          if (!classSchool) {
            res.status(400).json({ message: 'Invalid class' });
          }

          const classroomRepository = connection.getRepository(Classroom);
          const classroom = await classroomRepository.findOne({ name: attendence['Phòng học'] });

          if (!classroom) {
            res.status(400).json({ message: 'Invalid classroom' });
          }

          const scheduleRepository = connection.getRepository(Schedule);
          const schedule = await scheduleRepository.findOne(
            {
              categoryId: category.id,
              classId: classSchool.id,
              classroomId: classroom.id,
              accountId: 5,
            }
          );

          console.log('-------------------------------------------', classSchool, classroom, decoded.id);

          const createAttendence = new Attendence();
          createAttendence.scheduleId = schedule.id;
          createAttendence.timeIn = (new Date(attendence['Thời gian vào'])).toISOString();
          createAttendence.timeOut = (new Date(attendence['Thời gian ra'])).toISOString();
          createAttendence.date = (new Date(attendence['Ngày'])).toISOString();
          createAttendence.accountId = student.id;
          await transactionManager.save(createAttendence);
        }); 
      });

      fs.unlinkSync(req.file.path);
      res.status(200).json({ message: 'success' });
    } catch (error) {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: error.message });
    }
  }

  public getAttendences = async (req: Request, res: Response) => {
    const authorization = req.headers['authorization'];
    const accessToken = authorization.slice(7);
    const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number };

    const connection = await PostgresDb.getConnection();

    const searchName: string = decodeURIComponent(`${req.query.searchName}`);
    const classIds: number[] = decodeURIComponent(`${req.query.classIds}`).split(',').map(item => Number(item));
    const date: string = decodeURIComponent(`${req.query.date}`);
    const limit: number = Number(get(req.query, 'limit', 10));
    const offset: number = Number(get(req.query, 'offset', 0));
    
    const attendenceRepository = connection.getRepository(Attendence);
    
    let query = attendenceRepository.createQueryBuilder('attendence')
      .leftJoinAndSelect('attendence.account', 'account')
      .leftJoinAndSelect('attendence.schedule', 'schedule')
      .leftJoinAndSelect('schedule.category', 'category')
      .leftJoinAndSelect('schedule.session', 'session')
      .leftJoin('schedule.class', 'class')
      .where('attendence.date = :date', { date });

    if (classIds && classIds.filter(Boolean).length > 0) {
      query = query.andWhere('class.id IN (:...classIds)', { classIds });
    }

    query = query.andWhere('account.id = :accountId', { accountId: decoded.id });

    if (searchName != 'undefined') {
      query = query.andWhere(`LOWER(account.name) LIKE :name`, { name: `%${searchName.toLowerCase().trim()}%` });
    }

    const [attendences, count] = await query.orderBy('attendence.date', 'DESC')
      .skip(offset).take(limit).getManyAndCount();

    const data = attendences.map(attendence => {
      const timeCheckIn = moment(attendence.timeIn).set({ hours: 7, minute: 30 });
      const timeCheckOut = attendence.timeOut;
      const startSession = moment(attendence.schedule.session.startTime);
        // .set({ 
        //   years: new Date(timeCheckOut).getUTCFullYear(), 
        //   months: new Date(timeCheckOut).getUTCMonth(),
        //   day: new Date(timeCheckOut).getUTCDay(),
        // });
      const endSession = attendence.schedule.session.endTime;

      let status;

      if (!attendence.timeIn && !attendence.timeOut) {
        status = 'absent';
      }

      if (moment(timeCheckIn).isBefore(startSession, 'hour') || 
        (moment(timeCheckIn).isSame(startSession, 'hour') && 
          moment(timeCheckIn).subtract({ minute: 15 }).isBefore(startSession, 'minute'))) {
        status = 'attend';
      }

      if (moment(timeCheckIn).isAfter(startSession, 'hour') || 
        (moment(timeCheckIn).isSame(startSession, 'hour') && moment(timeCheckIn).isAfter(startSession, 'minute'))) {
        status = 'late';
      }

      return {
        name: attendence.account.name,
        msv: attendence.account.username,
        category: attendence.schedule.category.title,
        date: attendence.schedule.date,
        timeIn: attendence.timeIn,
        timeOut: attendence.timeOut,
        status: status,
      };
    });

    res.status(200).json({
      totalPage: count,
      data,
    });
  }
}