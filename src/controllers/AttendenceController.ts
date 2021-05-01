import Bluebird from 'bluebird';
import { Request, Response } from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { get, round } from 'lodash';
import moment from 'moment';
import { EntityRepository, Repository } from 'typeorm';
import xlsx from 'xlsx';
import PostgresDb from '../common/postgresDb';
import { Account, Category, Class, Classroom, Schedule } from '../models';
import Attendence from '../models/Attendence';
import { AttendenceStatus } from './../interfaces/attendence';

@EntityRepository(Attendence)
export default class AttendenceController extends Repository<Attendence>{
  public createAttendence = async (req: Request, res: Response) => {
    const file = xlsx.readFile(req.file.path, { cellDates: true, cellStyles: true });
    const file1 = file.Sheets[file.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(file1);
    const connection = await PostgresDb.getConnection();

    try {
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
          const schedule = await scheduleRepository.createQueryBuilder('schedule')
            .innerJoinAndSelect('schedule.session', 'session')
            .where({
              categoryId: category.id,
              classId: classSchool.id,
              classroomId: classroom.id,
              accountId: 5,
            })
            .getOne();

          const session = schedule.session;

          const timeCheckIn = moment(attendence['Thời gian vào']).set({ hours: 7, minute: 30 });
          const startSession = moment(session.startTime);

          let status;

          if (!attendence['Thời gian vào'] && !attendence['Thời gian ra']) {
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

          const createAttendence = new Attendence();
          createAttendence.scheduleId = schedule.id;
          createAttendence.timeIn = (new Date(attendence['Thời gian vào'])).toISOString();
          createAttendence.timeOut = (new Date(attendence['Thời gian ra'])).toISOString();
          createAttendence.date = (new Date(attendence['Ngày'])).toISOString();
          createAttendence.accountId = student.id;
          createAttendence.status = status as AttendenceStatus;
          await transactionManager.save(createAttendence);
        }); 
      });

      fs.unlinkSync(req.file.path);
      return res.status(200).json({ message: 'success' });
    } catch (error) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: error.message });
    }
  }

  public getAttendences = async (req: Request, res: Response) => {
    const authorization = req.headers['authorization'];
    const accessToken = authorization?.slice(7);
    const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number };

    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);
    const student = await accountRepository.findOne({ id: decoded.id, roleId: 1 })

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
    
    if (date != 'undefined') {
      query = query.where('attendence.date = :date', { date });
    }

    if (classIds && classIds.filter(Boolean).length > 0) {
      query = query.andWhere('class.id IN (:...classIds)', { classIds });
    }

    if (student) {
      query = query.andWhere('account.id = :accountId', { accountId: decoded.id });
    }

    if (searchName != 'undefined') {
      query = query.andWhere(`LOWER(account.name) LIKE :name`, { name: `%${searchName.toLowerCase().trim()}%` });
    }

    const [attendences, count] = await query.orderBy('attendence.date', 'DESC')
      .skip(offset).take(limit).getManyAndCount();

    const data = attendences.map(attendence => {
      return {
        name: attendence.account.name,
        msv: attendence.account.username,
        category: attendence.schedule.category.title,
        date: attendence.schedule.date,
        timeIn: attendence.timeIn,
        timeOut: attendence.timeOut,
        status: attendence.status,
      };
    });

    return res.status(200).json({
      totalPage: Math.ceil(count / limit),
      data,
    });
  }

  public getAttendenceStats = async (req: Request, res: Response) => {
    const schoolYearId = Number(decodeURIComponent(`${req.query.schoolYearId}`));
    const startDate = decodeURIComponent(`${req.query.startDate}`);
    const endDate = decodeURIComponent(`${req.query.endDate}`);
    const classId = Number(decodeURIComponent(`${req.query.classId}`));

    const connection = await PostgresDb.getConnection();
    const attendenceRepository = connection.getRepository(Attendence);

    let query = attendenceRepository.createQueryBuilder('attendence')
      .innerJoinAndSelect('attendence.account', 'account')
      .innerJoinAndSelect('account.class', 'class')
      .innerJoinAndSelect('class.schoolYear', 'schoolYear');

    query = query.where('schoolYear.id = :schoolYearId', { schoolYearId });


    if (classId) {
      query = query.andWhere('class.id = :classId', { classId });
    }

    query = query.andWhere('attendence.date >= :startDate AND attendence.date <= :endDate', { startDate, endDate })

    const allAttendence = await query.getCount();

    const attendStat = await query.andWhere('attendence.status = :status', { status: 'attend'}).getCount();
    const absentStat = await query.andWhere('attendence.status = :status', { status: 'absent'}).getCount();
    const lateStat = await query.andWhere('attendence.status = :status', { status: 'late'}).getCount();

    const stat = {
      total: allAttendence,
      attend: {
        value: attendStat,
        percent: round(attendStat / allAttendence),
      },
      absent: {
        value: absentStat,
        percent: round(absentStat / allAttendence),
      },
      late: {
        value: lateStat,
        percent: round(lateStat / allAttendence),
      },
    };

    const classRepository = connection.getRepository(Class);
    const chartsResponse = await classRepository.createQueryBuilder('class')
      .innerJoinAndSelect('class.schoolYear', 'schoolYear')
      .innerJoinAndSelect('class.accounts', 'account')
      .innerJoinAndSelect('account.attendence', 'attendence')
      .where('schoolYear.id = :schoolYearId', { schoolYearId })
      .andWhere('attendence.status = :status', { status: 'attend' })
      .getMany();

    const charts = chartsResponse.map(chart => ({
      id: chart.id,
      name: chart.name,
      value: chart.accounts.length,
    }));

    const result = {
      stat,
      charts,
    }

    return res.status(200).json(result);
  }

  public getTopAbsent = async (req: Request, res: Response) => {
    const schoolYearId = Number(req.query.schoolYearId);
    const classId = Number(req.query.classId);
    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);

    let query = accountRepository.createQueryBuilder('account')
      .select(['account.id', 'account.name'])
      .addSelect('COUNT(attendence.id)', 'absent')
      .innerJoin('account.attendence', 'attendence')
      .innerJoin('account.class', 'class')
      .innerJoin('class.schoolYear', 'schoolYear')
      .where({ roleId: 1, isActive: true })
      .andWhere('schoolYear.id = :schoolYearId', { schoolYearId });

    if (classId) {
      query = query.andWhere('class.id = :classId', { classId });
    }
      
    const accounts = await query.groupBy('account.id')
      .orderBy('absent', 'DESC')
      .limit(10)
      .getRawMany();

    return res.status(200).json(accounts);
  }
}