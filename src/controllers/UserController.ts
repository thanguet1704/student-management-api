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
    const limit = Number(req.query.limit) || 0;
    const offset = Number(req.query.offset) || 0;

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
          
          if (searchName != 'undefined') {
            query = query.andWhere(`LOWER(account.name) LIKE '%${searchName.toLowerCase().trim()}%'`);
          }

          const [students, count] = await query.orderBy('account.isActive', 'DESC')
            .addOrderBy('account.classId', 'ASC')
            .skip(offset)
            .take(limit)
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
          return res.status(200).json({ totalPage: Math.ceil(count / (limit > 0 ? limit : count)), data: results });
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

        const [teachers, count] = await query.orderBy('account.name', 'ASC').skip(offset).take(limit).getManyAndCount();

        const results = teachers.map(teacher => ({
            id: teacher.id,
            name: teacher.name,
            institua: teacher.institua.name,
            email: teacher.email,
            phone: teacher.phone,
            address: teacher.address,
        }));

        return res.status(200).json({ totalPage:  Math.ceil(count / (limit > 0 ? limit : count)), data: results });
      }
          
      default:
        return res.status(500);
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

        // if (!schoolYear){
        //   res.status(400).json({ error: 'Invalid khoa'});
        // }

        const classRepository = connection.getRepository(Class);
        const classDb = await classRepository.findOne({ id: body.classId });
        // if (!classDb) {
        //   res.status(400).json({ error: 'Invalid Class'});
        // }

        const instituaRepository = connection.getRepository(Institua);
        const institua = await instituaRepository.findOne({ id: body.instituaId });
        
        // if (!institua) {
        //   res.status(400).json({ error: 'Invalid Institua'});
        // }
        
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
    const username = req.body.username;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    try {
      if (oldPassword !== newPassword) {
        return res.status(400).json({ message: 'invalid new password' });
      }
  
      const authorization = req.headers['authorization'];
      const accessToken = authorization?.slice(7);
      const decoded = (jwt.verify(accessToken, process.env.SECRET)) as { id: number };
      const connection = await PostgresDb.getConnection();
      const accountRepository = connection.getRepository(Account);
  
      const account = await accountRepository.findOne({ id: decoded.id });
  
      
      if (account.username !== username) {
        return res.status(404).json({ message: 'Account has not existed' });
      }
  
      const isLogin = await bcrypt.compare(oldPassword, account.password);
      if (!isLogin) {
        return res.status(400).json({ message: 'invalid password' });
      }

      const salt = await bcrypt.genSalt(parseInt(process.env.SALT_NUMBER));
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      account.password = hashedPassword;
      accountRepository.save(account);
      return res.status(200).json();
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } 
}

