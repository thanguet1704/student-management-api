import Bluebird from 'bluebird';
import { Request, Response } from 'express';
import fs from 'fs';
import jwt, { decode } from 'jsonwebtoken';
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
          createAttendence.date = (new Date(attendence['Ngày'])).toISOString();;
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
    const account = await accountRepository.createQueryBuilder('account')
      .innerJoinAndSelect('account.role', 'role')
      .where({ id: decoded.id })
      .getOne();

    const searchName: string = decodeURIComponent(`${req.query.searchName}`);
    const classIds: number[] = decodeURIComponent(`${req.query.classIds}`).split(',').map(item => Number(item));
    const date = decodeURIComponent(`${req.query.date}`);
    const limit: number = Number(get(req.query, 'limit', 0));
    const offset: number = Number(get(req.query, 'offset', 0));
    
    const attendenceRepository = connection.getRepository(Attendence);

    if (account.role.name === 'student') {
      let query = attendenceRepository.createQueryBuilder('attendence')
      .innerJoinAndSelect('attendence.account', 'account')
      .innerJoinAndSelect('attendence.schedule', 'schedule')
      .innerJoinAndSelect('schedule.category', 'category')
      .innerJoinAndSelect('schedule.session', 'session')
      .innerJoin('schedule.class', 'class')
      .where('account.id = :accountId', { accountId: decoded.id });

      if (searchName != 'undefined' && Boolean(searchName)) {
        query = query.andWhere(`LOWER(category.title) LIKE :name`, 
          { name: `%${searchName.toLowerCase().trim()}%` });
      }

      const [attendences, count] = await query.orderBy('attendence.date', 'DESC')
      .skip(offset).take(limit).getManyAndCount();

      const data = attendences.map(attendence => {
        return {
          name: attendence.account.name,
          msv: attendence.account.username,
          category: attendence.schedule.category.title,
          date: attendence.date,
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
    
    let query = attendenceRepository.createQueryBuilder('attendence')
      .innerJoinAndSelect('attendence.account', 'account')
      .innerJoinAndSelect('attendence.schedule', 'schedule')
      .innerJoinAndSelect('schedule.category', 'category')
      .innerJoinAndSelect('schedule.session', 'session')
      .innerJoin('schedule.class', 'class')
      .where({ date });

    if (account.role.name === 'teacher') {
      query = query.andWhere('schedule.accountId = :accountId', { accountId: decoded.id });
    }
  
    if (classIds && classIds.filter(Boolean).length > 0) {
      query = query.andWhere('class.id IN (:...classIds)', { classIds });
    }

    if (searchName != 'undefined' && Boolean(searchName)) {
      query = query.andWhere(`LOWER(account.name) LIKE :name OR LOWER(category.title) LIKE :name`, 
        { name: `%${searchName.toLowerCase().trim()}%` });
    }

    const [attendences, count] = await query.orderBy('attendence.date', 'DESC')
      .skip(offset).take(limit).getManyAndCount();

    const data = attendences.map(attendence => {
      return {
        name: attendence.account.name,
        msv: attendence.account.username,
        category: attendence.schedule.category.title,
        date: attendence.date,
        timeIn: attendence.timeIn,
        timeOut: attendence.timeOut,
        status: attendence.status,
      };
    });

    return res.status(200).json({
      totalPage: Math.ceil(count / (limit ? limit : count)),
      data,
    });
  }

  public getAttendenceStats = async (req: Request, res: Response) => {
    const schoolYearId = decodeURIComponent(`${req.query.schoolYearId}`);
    const startDate = decodeURIComponent(`${req.query.startDate}`);
    const endDate = decodeURIComponent(`${req.query.endDate}`);
    const classId = Number(decodeURIComponent(`${req.query.classId}`));
    const semesterId = Number(req.query.semesterId);

    const connection = await PostgresDb.getConnection();
    const attendenceRepository = connection.getRepository(Attendence);

    let query = attendenceRepository.createQueryBuilder('attendence')
      .innerJoinAndSelect('attendence.account', 'account')
      .innerJoinAndSelect('account.class', 'class')
      .innerJoinAndSelect('class.schoolYear', 'schoolYear')
      .innerJoinAndSelect('attendence.schedule', 'schedule')
      .innerJoinAndSelect('schedule.semester', 'semester');

    query = query.where('schoolYear.id = :schoolYearId', { schoolYearId: Number(schoolYearId) });

    if (!Number.isNaN(semesterId)) {
      query = query.andWhere('semester.id = :semesterId', { semesterId });
    }

    if (!Number.isNaN(classId)) {
      query = query.andWhere('class.id = :classId', { classId });
    }

    if (startDate != 'undefined' && endDate != 'undefined' && Boolean(startDate) && Boolean(endDate)) {
      query = query.andWhere('attendence.date >= :startDate AND attendence.date <= :endDate', { startDate, endDate })
    }

    const allAttendence = await query.getCount();

    const attendStat = await query.andWhere('attendence.status = :status', { status: 'attend'}).getCount();
    const absentStat = await query.andWhere('attendence.status = :status', { status: 'absent'}).getCount();
    const lateStat = await query.andWhere('attendence.status = :status', { status: 'late'}).getCount();

    const stat = {
      total: {
        value: allAttendence
      },
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

    const chartsResponse = (await classRepository.query(
      `SELECT distinct(class.id) AS id,
        class.name AS name,
        COALESCE (COUNT(attendence.status) FILTER ( where attendence.status = 'attend' )) AS attend,
        COALESCE (COUNT(attendence.status) FILTER ( where attendence.status = 'absent' )) AS absent,
        COALESCE (COUNT(attendence.status) FILTER ( where attendence.status = 'late' )) AS late
      FROM class 
      INNER JOIN school_year  ON school_year.id = class.school_year_id
      INNER JOIN account  ON account.class_id=class.id
      INNER JOIN attendence ON attendence.account_id=account.id
      INNER JOIN schedule ON attendence.schedule_id=schedule.id
      INNER JOIN semester ON schedule.semester_id=semester.id
      WHERE school_year.id = ${schoolYearId} AND semester.id = 1
      GROUP BY class.id`
    )) as {id: number, name: string, attend: number, absent: number, late: number}[];

    const charts = chartsResponse.map(chart => ({
      id: chart.id,
      name: chart.name,
      attend: chart.attend,
      absent: chart.absent,
      late: chart.late,
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
      .select([`account.id "id"`, `account.name "name"`, `class.name "class"`])
      .addSelect('COUNT(attendence.id)', 'absent')
      .innerJoin('account.attendence', 'attendence')
      .innerJoin('account.class', 'class')
      .innerJoin('class.schoolYear', 'schoolYear')
      .where({ roleId: 1, isActive: true })
      .andWhere('schoolYear.id = :schoolYearId', { schoolYearId });

    if (classId) {
      query = query.andWhere('class.id = :classId', { classId });
    }
      
    const accounts = await query.groupBy('account.id').addGroupBy('class.name')
      .orderBy('absent', 'DESC')
      .limit(10)
      .getRawMany();

    return res.status(200).json(accounts);
  }
}