import { ICreateStudent, ICreateTeacher } from './../interfaces/user';
import BlueBird from 'bluebird';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { EntityRepository, Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';
import { Account, Class, SchoolYear } from '../models';
import xlsx from 'xlsx';
import Institua from '../models/Institua';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

@EntityRepository(Account)
export default class UserController extends Repository<Account>{
  public getUsers = async (req: Request, res: Response) => {

    const type = req.params.type;
    const searchName = decodeURIComponent(`${req.query.search}`);
    const classId = decodeURIComponent(`${req.query.classId}`).split(',').map(id => Number(id));

    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);

    console.log(searchName);

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

            if (classId && classId.filter(Boolean).length !== 0) {
                query = query.andWhere(`account.classId IN (:...classId)`, { classId: classId.filter(Boolean) });
            }

            const students = await query.getMany();
            const results = students.map(student => ({
                id: student.id,
                msv: student.username,
                name: student.name,
                class: student.class.name,
                institua: student.institua.name,
                address: student.address,
            }));
            res.status(200).json(results);
            break;
        }

        case 'teachers': {
            let query = accountRepository.createQueryBuilder('account')
                .leftJoin('account.role', 'role')
                .leftJoinAndSelect('account.class', 'class')
                .leftJoinAndSelect('account.institua', 'institua')
                .leftJoinAndSelect('account.schoolYear', 'schoolYear')
                .where('role.name = :teacher', { teacher: 'teacher' });
            
            if (searchName) {
                query = query.andWhere(`LOWER(account.name) LIKE '%${searchName.toLowerCase().trim()}%'`);
            }

            const teachers = await query.getMany();

            const results = teachers.map(teacher => ({
                id: teacher.id,
                name: teacher.name,
                institua: teacher.institua.name,
                email: teacher.email,
                phone: teacher.phone,
            }));

            res.status(200).json(results);
            break;
        }
            
        default:
            res.status(500);
    }
  }

  public updateUser = async (req: Request, res: Response) => {
    const username = req.body.username;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);

    const account = await accountRepository.findOne({ username });

    if (!account) {
      res.status(500).json({ message: 'Account has not existed' });
    }

    const isLogin = await bcrypt.compare(oldPassword, account.password);
    if (isLogin) {
      const salt = await bcrypt.genSalt(parseInt(process.env.SALT_NUMBER));
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      account.password = hashedPassword;
      accountRepository.save(account);
      res.status(201).json({ message: 'updated' });
    }

    res.status(500).json({ message: 'Account has not existed' });
  }

  public createUsers = async (req: Request, res: Response) => {
    const file = xlsx.readFile(req.file.path, { cellDates: true, cellStyles: true });
    const file1 = file.Sheets[file.SheetNames[0]];
    const data: ICreateStudent[] | ICreateTeacher[] = xlsx.utils.sheet_to_json(file1);
    
    const type = req.params.type;
    const body: ICreateStudent | ICreateTeacher = req.body.user;

    switch (type) {
      case 'students':
        await this.createStudents(data as ICreateStudent[], req, res);
        break;
      
      case 'teachers':
        await this.createTeachers(data as ICreateTeacher[], req, res);
        break;

      case 'student':
        await this.createStudent(body as ICreateStudent, req, res);

      case 'teacher':
        await this.createTeacher(body as ICreateTeacher, req, res);

      default:
        break;
    }
  }

  public async createStudents(data: ICreateStudent[], req: Request, res: Response) {
    const connection = await PostgresDb.getConnection();
    
    try {
      await BlueBird.map(data, async account => {
        return await connection.manager.transaction(async transactionManager => {
          try {
            const schoolYearRepository = connection.getRepository(SchoolYear);
            const schoolYear = await schoolYearRepository.findOne({ name: account.khoa })

            if (!schoolYear){
              res.status(400).json({ error: 'Invalid khoa'});
            }

            const classRepository = connection.getRepository(Class);
            const classDb = await classRepository.findOne({ name: account.class });
            if (!classDb) {
              res.status(400).json({ error: 'Invalid Class'});
            }

            const instituaRepository = connection.getRepository(Institua);
            const institua = await instituaRepository.findOne({ name: account.institua });
            
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
            res.status(500).json(error.message);
          }
        });
      });

      fs.unlinkSync(req.file.path);

      res.status(201).json({ message: 'success' });
    } catch (error) {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: error.message });
    }
  }

  public async createTeachers(data: ICreateTeacher[], req: Request, res: Response) {
    const connection = await PostgresDb.getConnection();
    
    try {
      await BlueBird.map(data, async account => {
        return await connection.manager.transaction(async transactionManager => {
          try {
            const classRepository = connection.getRepository(Class);
            const classDb = await classRepository.findOne({ name: account.class });
            if (!classDb) {
              res.status(400).json({ error: 'Invalid Class'});
            }

            const instituaRepository = connection.getRepository(Institua);
            const institua = await instituaRepository.findOne({ name: account.institua });
            
            if (!institua) {
              res.status(400).json({ error: 'Invalid Institua'});
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

            return await transactionManager.save(teacher);
          } catch (error) {
            res.status(500).json(error.message);
          }
        });
      });

      fs.unlinkSync(req.file.path);

      res.status(201).json({ message: 'success' });
    } catch (error) {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: error.message });
    }
  }

  public async createStudent(body: ICreateStudent, req: Request, res: Response) {
    const connection = await PostgresDb.getConnection();
    
    try {
      await connection.manager.transaction(async transactionManager => {

        const schoolYearRepository = connection.getRepository(SchoolYear);
        const schoolYear = await schoolYearRepository.findOne({ name: body.khoa })

        if (!schoolYear){
          res.status(400).json({ error: 'Invalid khoa'});
        }

        const classRepository = connection.getRepository(Class);
        const classDb = await classRepository.findOne({ name: body.class });
        if (!classDb) {
          res.status(400).json({ error: 'Invalid Class'});
        }

        const instituaRepository = connection.getRepository(Institua);
        const institua = await instituaRepository.findOne({ name: body.institua });
        
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

      fs.unlinkSync(req.file.path);

      res.status(201).json({ message: 'success' });
    } catch (error) {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: error.message });
    }
  }

  public async createTeacher(body: ICreateTeacher, req: Request, res: Response) {
    const connection = await PostgresDb.getConnection();
    
    try {
      await connection.manager.transaction(async transactionManager => {
        const classRepository = connection.getRepository(Class);
        const classDb = await classRepository.findOne({ name: body.class });
        if (!classDb) {
          res.status(400).json({ error: 'Invalid Class'});
        }

        const instituaRepository = connection.getRepository(Institua);
        const institua = await instituaRepository.findOne({ name: body.institua });
        
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
        teacher.classId = classDb.id;
        teacher.instituaId = institua.id;
        teacher.roleId = 2;
        teacher.password = hashedPassword;

        return await transactionManager.save(teacher);
      });

      fs.unlinkSync(req.file.path);

      res.status(201).json({ message: 'success' });
    } catch (error) {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: error.message });
    }
  }
}

