import bcrypt from 'bcryptjs';
import BlueBird from 'bluebird';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { EntityRepository, Repository } from 'typeorm';
import xlsx from 'xlsx';
import PostgresDb from '../common/postgresDb';
import { Account, Class, SchoolYear } from '../models';
import Institua from '../models/Institua';
import { ICreateUser, ICreateUsers } from './../interfaces/user';

dotenv.config();

@EntityRepository(Account)
export default class UserController extends Repository<Account>{
  public getUsers = async (req: Request, res: Response) => {

    const type = req.params.type;
    const searchName = decodeURIComponent(`${req.query.search}`);

    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);

    switch (type) {
        case 'students': {
            let query = accountRepository.createQueryBuilder('account')
                .leftJoin('account.role', 'role')
                .leftJoinAndSelect('account.class', 'class')
                .leftJoinAndSelect('account.institua', 'institua')
                .leftJoinAndSelect('account.schoolYear', 'schoolYear')
                .where('role.name = :student', { student: 'student' });

            console.log(searchName);
            
            if (searchName != 'undefined') {
                query = query.andWhere(`LOWER(account.name) LIKE '%${searchName.toLowerCase().trim()}%'`);
            }

            const [students, count] = await query.orderBy('class.id', 'ASC')
              .getManyAndCount();
            const results = students.map(student => ({
                id: student.id,
                msv: student.username,
                name: student.name,
                class: student.class.name,
                institua: student.institua.name,
                address: student.address,
                isActive: student.isActive,
            }));
            res.status(200).json({ totalPage: count, data: results });
            break;
        }

        case 'teachers': {
            let query = accountRepository.createQueryBuilder('account')
                .leftJoin('account.role', 'role')
                .leftJoinAndSelect('account.class', 'class')
                .leftJoinAndSelect('account.institua', 'institua')
                .leftJoinAndSelect('account.schoolYear', 'schoolYear')
                .where('account.roleId = 2');
            
            if (searchName != 'undefined') {
                query = query.andWhere(`LOWER(account.name) LIKE '%${searchName.toLowerCase().trim()}%'`);
            }

            const [teachers, count] = await query.getManyAndCount();

            const results = teachers.map(teacher => ({
                id: teacher.id,
                name: teacher.name,
                institua: teacher.institua.name,
                email: teacher.email,
                phone: teacher.phone,
                address: teacher.address,
            }));

            res.status(200).json({ totalPage:  count, data: results });
            break;
        }
            
        default:
            res.status(500);
    }
  }

  public async createStudents(req: Request, res: Response) {
    const file = xlsx.readFile(req.file.path, { cellDates: true, cellStyles: true });
    const file1 = file.Sheets[file.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(file1);
    
    const connection = await PostgresDb.getConnection();
    
    try {
      await BlueBird.map(data, async (account: any) => {
        return await connection.manager.transaction(async transactionManager => {
          try {
            const schoolYearRepository = connection.getRepository(SchoolYear);
            const schoolYear = await schoolYearRepository.findOne({ name: account['Khóa'] })

            if (!schoolYear){
              res.status(400).json({ error: 'Invalid khoa'});
            }

            const classRepository = connection.getRepository(Class);
            const classDb = await classRepository.findOne({ name: account['Lớp'] });
            if (!classDb) {
              res.status(400).json({ error: 'Invalid Class'});
            }

            const instituaRepository = connection.getRepository(Institua);
            const institua = await instituaRepository.findOne({ name: account['Đơn vị'] });
            
            if (!institua) {
              res.status(400).json({ error: 'Invalid Institua'});
            }
            
            const salt = bcrypt.genSaltSync(Number(process.env.SALT_NUMBER));
            const hashedPassword = (account.msv, salt);

            const student = new Account();
            student.username = account.msv;
            student.name = account.name;
            student.address = account.address;
            student.email = account.email;
            student.phone = account.phone;
            student.schoolYearId = schoolYear.id;
            student.classId = classDb.id;
            student.instituaId = institua.id;
            student.roleId = 1;
            student.password = hashedPassword;

            return await transactionManager.save(student);
          } catch (error) {
            fs.unlinkSync(req.file.path);
            return res.status(500).json(error.message);
          }
        });
      });

      fs.unlinkSync(req.file.path);

      return res.status(201).json({ message: 'success' });
    } catch (error) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: error.message });
    }
  }

  public async createTeachers(req: Request, res: Response) {
    const file = xlsx.readFile(req.file.path, { cellDates: true, cellStyles: true });
    const file1 = file.Sheets[file.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(file1);
    const connection = await PostgresDb.getConnection();
    
    try {
      await connection.manager.transaction(async transactionManager => {
        return await BlueBird.map(data, async (account: any) => {
          const classRepository = connection.getRepository(Class);
          const classDb = await classRepository.findOne({ name: account['Lớp'] });
          if (!classDb) {
            res.status(400).json({ error: 'Invalid Class'});
          }

          const instituaRepository = connection.getRepository(Institua);
          const institua = await instituaRepository.findOne({ name: account['Đơn vị'] });
          
          if (!institua) {
            return res.status(400).json({ error: 'Invalid Institua'});
          }
          
          const salt = bcrypt.genSaltSync(Number(process.env.SALT_NUMBER));
          const hashedPassword = (account.phone, salt);

          const teacher = new Account();
          teacher.username = account.email;
          teacher.name = account.name;
          teacher.address = account.address;
          teacher.email = account.email;
          teacher.phone = account.phone;
          teacher.classId = classDb.id;
          teacher.instituaId = institua.id;
          teacher.roleId = 2;
          teacher.password = hashedPassword;

          await transactionManager.save(teacher);
        });
      });

      fs.unlinkSync(req.file.path);

      return res.status(201).json({ message: 'success' });
    } catch (error) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: error.message });
    }
  }

  public async createStudent(req: Request, res: Response) {
    const body: ICreateUser = req.body;
    const connection = await PostgresDb.getConnection();
    
    try {
      await connection.manager.transaction(async transactionManager => {
        const schoolYearRepository = connection.getRepository(SchoolYear);
        const schoolYear = await schoolYearRepository.findOne({ id: body.schoolYearId })

        if (!schoolYear){
          res.status(400).json({ error: 'Invalid khoa'});
        }

        const classRepository = connection.getRepository(Class);
        const classDb = await classRepository.findOne({ id: body.classId });
        if (!classDb) {
          res.status(400).json({ error: 'Invalid Class'});
        }

        const instituaRepository = connection.getRepository(Institua);
        const institua = await instituaRepository.findOne({ id: body.instituaId });
        
        if (!institua) {
          res.status(400).json({ error: 'Invalid Institua'});
        }
        
        const salt = bcrypt.genSaltSync(Number(process.env.SALT_NUMBER));
        const hashedPassword = (body.msv, salt);

        const student = new Account();
        student.username = body.msv;
        student.name = body.name;
        student.address = body.address;
        student.email = body.email;
        student.phone = body.phone;
        student.schoolYearId = schoolYear.id;
        student.classId = classDb.id;
        student.instituaId = institua.id;
        student.roleId = 1;
        student.password = hashedPassword;

        return await transactionManager.save(student);
      });

      return res.status(201).json({ message: 'success' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  public async createTeacher(req: Request, res: Response) {
    const body: ICreateUser = req.body;
    const connection = await PostgresDb.getConnection();
    
    try {
      await connection.manager.transaction(async transactionManager => {
        const instituaRepository = connection.getRepository(Institua);
        const institua = await instituaRepository.findOne({ id: body.instituaId });
        
        if (!institua) {
          res.status(400).json({ error: 'Invalid Institua'});
        }
        
        const salt = bcrypt.genSaltSync(Number(process.env.SALT_NUMBER));
        const hashedPassword = (body.phone, salt);

        const teacher = new Account();
        teacher.username = body.email;
        teacher.name = body.name;
        teacher.address = body.address;
        teacher.email = body.email;
        teacher.phone = body.phone;
        teacher.instituaId = institua.id;
        teacher.roleId = 2;
        teacher.password = hashedPassword;

        return await transactionManager.save(teacher);
      });

      return res.status(201).json({ message: 'success' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  public updatePassword = async (req: Request, res: Response) => {
    const authorization = req.headers['authorization'];
    const accessToken = authorization?.slice(7);
    const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number };
    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);

    const account = await accountRepository.findOne({ id: decoded.id });

    const username = req.body.username;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    if (account.username !== username) {
      return res.status(400).json({ message: 'Account has not existed' });
    }

    const isLogin = await bcrypt.compare(oldPassword, account.password);
    if (isLogin) {
      const salt = await bcrypt.genSalt(parseInt(process.env.SALT_NUMBER));
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      account.password = hashedPassword;
      accountRepository.save(account);
      return res.status(200).json();
    }

    return res.status(500).json({ message: 'Account has not existed' });
  } 
}

