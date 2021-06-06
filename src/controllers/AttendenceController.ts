import Bluebird from 'bluebird';
import { Request, Response } from 'express';
import fs from 'fs';
import jwt, { decode } from 'jsonwebtoken';
import { get, round } from 'lodash';
import moment from 'moment';
import { EntityRepository, Repository, getRepository } from 'typeorm';
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
          const student = await accountRepository.findOne({ email: attendence['Email'] });

          if (!student) {
            res.status(400).json({ message: 'Học viên không tồn tại' });
          }

          const categoryRepository = connection.getRepository(Category);
          const category = await categoryRepository.findOne({ title: attendence['Chuyên đề'] });

          if (!category) {
            res.status(400).json({ message: 'Chuyên đề không tồn tại' });
          }

          const classRository = connection.getRepository(Class);
          const classSchool = await classRository.findOne({ name: attendence['Lớp'] });

          if (!classSchool) {
            res.status(400).json({ message: 'Lớp không tồn tại' });
          }

          const classroomRepository = connection.getRepository(Classroom);
          const classroom = await classroomRepository.findOne({ name: attendence['Phòng học'] });

          if (!classroom) {
            res.status(400).json({ message: 'Phòng học không tồn tại' });
          }

          const scheduleRepository = connection.getRepository(Schedule);
          const schedule = await scheduleRepository.createQueryBuilder('schedule')
            .innerJoinAndSelect('schedule.session', 'session')
            .where({
              categoryId: category.id,
              classId: classSchool.id,
              classroomId: classroom.id,
              // accountId: ,
            })
            .getOne();

          const session = schedule.session;

          const timeCheckIn = moment(attendence['Thời gian vào']).isValid() ? 
            moment(attendence['Thời gian vào'], 'DD-MM-YYYY h:mm:ss').format()
            : null;
          const startSession = moment(session.startTime).set(
            { year: new Date().getFullYear(), month: new Date().getMonth(), date: new Date().getDate()}).format();

          let status;

          if (!attendence['Thời gian vào'] || !attendence['Thời gian ra']) {
            status = 'absent';
          } else {
            if (moment(timeCheckIn).isBefore(startSession, 'hour') || 
            (moment(timeCheckIn).isSame(startSession, 'hour') && 
              moment(timeCheckIn).subtract({ minute: 15 }).isBefore(startSession, 'minute'))) {
              status = 'attend';
            }

          if (moment(timeCheckIn).isAfter(startSession, 'hour') || 
            (moment(timeCheckIn).isSame(startSession, 'hour') && moment(timeCheckIn).isAfter(startSession, 'minute'))) {
              status = 'late';
            }
          }

          let timeIn;
          let timeOut;

          console.log(moment(attendence['Thời gian vào'], 'DD-MM-YYYY h:mm:ss').format());

          if (moment(attendence['Thời gian vào'], 'DD-MM-YYYY h:mm:ss').format() !== 'Invalid date') {
            timeIn = (new Date(moment(attendence['Thời gian vào'], 'DD-MM-YYYY h:mm:ss').format())).toISOString();
          }

          if (moment(attendence['Thời gian ra'], 'DD-MM-YYYY h:mm:ss').format() !== 'Invalid date') {
            timeOut = (new Date(moment(attendence['Thời gian ra'], 'DD-MM-YYYY h:mm:ss').format())).toISOString();
          }

          const createAttendence = new Attendence();
          createAttendence.scheduleId = schedule.id;
          createAttendence.timeIn = timeIn;
          createAttendence.timeOut = timeOut;
          createAttendence.date = moment(attendence['Ngày'], 'DD-MM-YYYY h:mm:ss').add(7, 'hours').format();
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
    const classId = Number(req.query.classId);
    const date = moment(decodeURIComponent(`${req.query.date}`), 'YYYY-MM-DD').format();
    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);
    const semesterId = Number(req.query.semesterId);
    const startDate = moment(new Date(date)).toISOString();
    const endDate = moment(new Date(date)).add(1, 'days').toISOString();

    let skip = 0;
    let take = 0;
    if (limit) take = limit;
    if (offset) skip = offset;
    
    const attendenceRepository = connection.getRepository(Attendence);

    if (account.roleId === 1) {
      
      const result = await this.getAttendenceByStudent(semesterId, searchName, account, skip, take);

      return res.status(200).json(result);
    }
    
    let query = attendenceRepository.createQueryBuilder('attendence')
      .innerJoinAndSelect('attendence.account', 'account')
      .innerJoinAndSelect('attendence.schedule', 'schedule')
      .innerJoinAndSelect('schedule.category', 'category')
      .innerJoinAndSelect('schedule.session', 'session')
      .innerJoin('schedule.semester', 'semester')
      .innerJoin('schedule.class', 'class')
      .where(`attendence.date > :startDate AND attendence.date < :endDate`, { startDate, endDate });

    if (account.role.name === 'teacher') {
      query = query.andWhere('schedule.accountId = :accountId', { accountId: decoded.id });
    }
  
    if (semesterId) {
      query = query.andWhere('semester.id = :semesterId', { semesterId });
    }

    if (classId) {
      query = query.andWhere('class.id = :classId', { classId });
    }

    if (searchName != 'undefined' && Boolean(searchName)) {
      query = query.andWhere(`LOWER(account.name) LIKE :name OR LOWER(category.title) LIKE :name`, 
        { name: `%${searchName.toLowerCase().trim()}%` });
    }

    const [attendences, count] = await query.orderBy('attendence.date', 'DESC')
      .skip(skip).take(take).getManyAndCount();

    const data = attendences.map(attendence => {
      return {
        name: attendence.account.name,
        msv: attendence.account.username,
        category: attendence.schedule.category.title,
        date: moment(attendence.date).format(),
        timeIn: moment(attendence.timeIn).format(),
        timeOut: moment(attendence.timeOut).format(),
        status: attendence.status,
      };
    });

    console.log(data);

    return res.status(200).json({
      totalPage: Math.ceil(count / (take ? take : count)) | 0,
      data,
    });
  }

  public getAttendenceStats = async (req: Request, res: Response) => {
    const schoolYearId = Number(req.query.schoolYearId);
    const classId = Number(req.query.classId);
    const semesterId = Number(req.query.semesterId);

    const authorization = req.headers['authorization'];
    const accessToken = authorization?.slice(7);
    const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number };

    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);

    const account = await accountRepository.createQueryBuilder('account')
      .where({ id: decoded.id })
      .getOne();

    if (account.roleId === 3) {
      const result = await this.getStatsByAdmin(semesterId, schoolYearId, account, classId);
      
      return res.status(200).json(result);
    }

    const result = await this.getStatsByTeacher(semesterId, account);

    return res.status(200).json(result);
  }

  public getTopAbsent = async (req: Request, res: Response) => {
    const schoolYearId = Number(req.query.schoolYearId);
    const classId = Number(req.query.classId);
    const semesterId = Number(req.query.semesterId);
    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);

    const authorization = req.headers['authorization'];
    const accessToken = authorization?.slice(7);
    const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number };

    const account = await accountRepository.createQueryBuilder('account')
      .where({ id: decoded.id })
      .getOne();

    if (account.roleId === 3) {
      const accounts = await this.getListAbsentBySchoolYear(semesterId, schoolYearId, account, classId);

      return res.status(200).json(accounts);
    }

    const accounts = await this.getListAbsentByClassId(semesterId, classId, account);

    return res.status(200).json(accounts);
  }

  public getStatsByAdmin = async (semesterId: number, schoolYearId: number, account: Account, classId: number) => {
    const connection = await PostgresDb.getConnection();
    const attendenceRepository = connection.getRepository(Attendence);

    let query = attendenceRepository.createQueryBuilder('attendence')
      .innerJoinAndSelect('attendence.account', 'account')
      .innerJoinAndSelect('account.class', 'class')
      .innerJoinAndSelect('class.schoolYear', 'schoolYear')
      .innerJoinAndSelect('attendence.schedule', 'schedule')
      .innerJoinAndSelect('schedule.semester', 'semester');

    if (!Number.isNaN(semesterId)) {
      query = query.andWhere('semester.id = :semesterId', { semesterId });
    }

    const allAttendence = await query.getCount();

    const attendStat = await query.andWhere('attendence.status = :status', { status: 'attend'}).getCount();
    const absentStat = await query.andWhere('attendence.status = :status', { status: 'absent'}).getCount();
    const lateStat = await query.andWhere('attendence.status = :status', { status: 'late'}).getCount();

    let stat = {
      total: {
        value: allAttendence
      },
      attend: {
        value: attendStat,
        percent: round(attendStat / allAttendence, 2) || 0,
      },
      absent: {
        value: absentStat,
        percent: round(absentStat / allAttendence, 2) || 0,
      },
      late: {
        value: lateStat,
        percent: round(lateStat / allAttendence, 2) || 0,
      },
    };

    const classRepository = connection.getRepository(Class);

    let chartsResponse = 
      `SELECT distinct(class.id) AS id,
        class.name AS name,
        COALESCE (COUNT(attendence.status) FILTER ( where attendence.status = 'attend' )) AS attend,
        COALESCE (COUNT(attendence.status) FILTER ( where attendence.status = 'absent' )) AS absent,
        COALESCE (COUNT(attendence.status) FILTER ( where attendence.status = 'late' )) AS late
      FROM school_year 
      INNER JOIN class  ON school_year.id = class.school_year_id
      INNER JOIN account  ON account.class_id = class.id
      INNER JOIN attendence ON attendence.account_id = account.id
      INNER JOIN schedule ON attendence.schedule_id = schedule.id
      INNER JOIN semester ON schedule.semester_id=semester.id
      WHERE semester.id = ${semesterId}`;

    if (account.roleId === 3) {
      chartsResponse = `${chartsResponse} AND school_year.id = ${schoolYearId}`
    }

    if (account.roleId === 2) {
      chartsResponse = `${chartsResponse} AND schedule.account_id = ${account.id}`
    }

    const dataCharts = (await classRepository.query(
      `${chartsResponse}
      GROUP BY class.id`
    )) as {id: number, name: string, attend: number, absent: number, late: number}[];

    const charts = dataCharts.map(chart => ({
      id: chart.id,
      name: chart.name,
      attend: chart.attend,
      absent: chart.absent,
      late: chart.late,
    }));

    if (dataCharts.length === 0) {
      stat = {
        total: {
          value: 0
        },
        attend: {
          value: 0,
          percent: 0,
        },
        absent: {
          value: 0,
          percent: 0,
        },
        late: {
          value: 0,
          percent: 0,
        },
      };
    }

    const result = {
      stat,
      charts,
    }

    return result;
  }

  public getStatsByTeacher = async (semesterId: number, account: Account) => {
    const connection = await PostgresDb.getConnection();
    const attendenceRepository = connection.getRepository(Attendence);
    let query = attendenceRepository.createQueryBuilder('attendence')
      .innerJoinAndSelect('attendence.account', 'account')
      .innerJoinAndSelect('account.class', 'class')
      .innerJoinAndSelect('class.schoolYear', 'schoolYear')
      .innerJoinAndSelect('attendence.schedule', 'schedule')
      .innerJoinAndSelect('schedule.semester', 'semester');

    if (!Number.isNaN(semesterId)) {
      query = query.andWhere('semester.id = :semesterId', { semesterId });
    }

    query = query.andWhere('schedule.accountId = :accountId', { accountId: account.id });

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
        percent: round(attendStat / allAttendence, 2) || 0,
      },
      absent: {
        value: absentStat,
        percent: round(absentStat / allAttendence, 2) || 0,
      },
      late: {
        value: lateStat,
        percent: round(lateStat / allAttendence, 2) || 0,
      },
    };

    const classRepository = connection.getRepository(Class);

    let chartsResponse = 
      `SELECT distinct(class.id) AS id,
        class.name AS name,
        COALESCE (COUNT(attendence.status) FILTER ( where attendence.status = 'attend' )) AS attend,
        COALESCE (COUNT(attendence.status) FILTER ( where attendence.status = 'absent' )) AS absent,
        COALESCE (COUNT(attendence.status) FILTER ( where attendence.status = 'late' )) AS late
        FROM class 
        INNER JOIN school_year  ON school_year.id = class.school_year_id
        INNER JOIN schedule ON schedule.class_id=class.id
        INNER JOIN attendence ON attendence.schedule_id=schedule.id
        INNER JOIN semester ON schedule.semester_id=semester.id
        WHERE semester.id = ${semesterId}`;

    chartsResponse = `${chartsResponse} AND schedule.account_id = ${account.id}`

    const dataCharts = (await classRepository.query(
      `${chartsResponse}
      GROUP BY class.id`
    )) as {id: number, name: string, attend: number, absent: number, late: number}[];

    const charts = dataCharts.map(chart => ({
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

    return result;
  }

  public getListAbsentBySchoolYear = async (semesterId: number, schoolYearId: number, account: Account, classId: number) => {
    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);
  
    let query = accountRepository.createQueryBuilder('account')
      .select([`account.id "id"`, `account.name "name"`, `class.name "class"`, `account.email "email"`])
      .addSelect('COUNT(attendence.id)', 'absent')
      .innerJoin('account.attendence', 'attendence')
      .innerJoin('account.class', 'class')
      .innerJoin('class.schoolYear', 'schoolYear')
      .innerJoin('attendence.schedule', 'schedule')
      .innerJoin('schedule.semester', 'semester')
      .where({ roleId: 1, isActive: true });

    if (!Number.isNaN(semesterId)) {
      query = query.andWhere('semester.id = :semesterId', { semesterId });
    }

    if (!Number.isNaN(schoolYearId)) {
      query = query.andWhere('schoolYear.id = :schoolYearId', { schoolYearId })
    }

    if (!Number.isNaN(classId)) {
      query = query.andWhere('class.id = :classId', { classId });
    }

    const accounts = await query.groupBy('account.id').addGroupBy('class.name')
      .orderBy('absent', 'DESC')
      .limit(7)
      .getRawMany();

    return accounts;
  }

  public getListAbsentByClassId = async (semesterId: number, classId: number, account: Account) => {
    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);
  
    let query = accountRepository.createQueryBuilder('account')
      .select([`account.id "id"`, `account.name "name"`, `class.name "class"`, `account.email "email"`])
      .addSelect('COUNT(attendence.id)', 'absent')
      .innerJoin('account.attendence', 'attendence')
      .innerJoin('account.class', 'class')
      .innerJoin('class.schoolYear', 'schoolYear')
      .innerJoin('attendence.schedule', 'schedule')
      .innerJoin('schedule.semester', 'semester')
      .where({ roleId: 1, isActive: true });

    if (!Number.isNaN(semesterId)) {
      query = query.andWhere('semester.id = :semesterId', { semesterId });
    }

    query = query.andWhere('schedule.accountId = :accountId', { accountId: account.id });

    if (!Number.isNaN(classId)) {
      query = query.andWhere('class.id = :classId', { classId });
    }
      
    const accounts = await query.groupBy('account.id').addGroupBy('class.name')
      .orderBy('absent', 'DESC')
      .limit(7)
      .getRawMany();

    return accounts;
  }

  public getAttendenceByStudent = async (semesterId: number, searchName: string, account: Account, skip: number, take: number) => {
    const connection = await PostgresDb.getConnection();
    const attendenceRepository = connection.getRepository(Attendence);

    let query = attendenceRepository.createQueryBuilder('attendence')
      .innerJoinAndSelect('attendence.schedule', 'schedule')
      .innerJoinAndSelect('schedule.category', 'category')
      .innerJoinAndSelect('schedule.session', 'session')
      .innerJoinAndSelect('schedule.class', 'class')
      .innerJoin('class.schoolYear', 'schoolYear')
      .innerJoinAndSelect('schedule.semester', 'semester')
      .innerJoinAndSelect('attendence.account', 'account')
      .where('account.id = :accountId', { accountId: account.id });

      if (semesterId) {
        query = query.andWhere('semester.id = :semesterId', { semesterId });
      }

      if (searchName != 'undefined' && Boolean(searchName)) {
        query = query.andWhere(`LOWER(category.title) LIKE :name`, 
          { name: `%${searchName.toLowerCase().trim()}%` });
      }

      const [attendences, count] = await query.orderBy('attendence.date', 'DESC')
      .skip(skip).take(take).getManyAndCount();

      const data = attendences.map(attendence => {
        return {
          name: attendence.account.name,
          msv: attendence.account.username,
          category: attendence.schedule.category.title,
          date: moment(attendence.date).format(),
          timeIn: moment(attendence.timeIn).format(),
          timeOut: moment(attendence.timeOut).format(),
          status: attendence.status,
        };
      });

      return {
        totalPage: count === 0 ? 0 : Math.ceil(count / (take ? take : count)),
        data,
      }
  }
}