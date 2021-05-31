import bcrypt from 'bcryptjs';
import BlueBird from 'bluebird';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { EntityRepository, Repository, getRepository } from 'typeorm';
import xlsx from 'xlsx';
import PostgresDb from '../common/postgresDb';
import { Account, Class } from '../models';
import Institua from '../models/Institua';
import { ICreateUser, IUpdateInfo } from './../interfaces/user';
import moment from 'moment';

dotenv.config();

@EntityRepository(Account)
export default class UserController extends Repository<Account>{
  public getUsers = async (req: Request, res: Response) => {

    const type = req.params.type;
    const searchName = decodeURIComponent(`${req.query.search}`);
    const limit = Number(req.query.limit) || 0;
    const offset = Number(req.query.offset) || 0;
    const classId = Number(req.query.classId);

    const connection = await PostgresDb.getConnection();
    const accountRepository = connection.getRepository(Account);

    switch (type) {
      case 'students': {
        let query = accountRepository.createQueryBuilder('account')
          .leftJoin('account.role', 'role')
          .leftJoinAndSelect('account.class', 'class')
          .leftJoinAndSelect('account.institua', 'institua')
          .where('role.name = :student', { student: 'student' });

        if (classId) {
          query = query.andWhere('class.id = :classId', { classId });
        }
        
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
          birthday: student.birthday,
          gender: student.gender,
          isActive: student.isActive,
        }));
        return res.status(200).json({ totalPage: Math.ceil(count / (limit > 0 ? limit : count)), data: results });
      }

      case 'teachers': {
        let query = accountRepository.createQueryBuilder('account')
          .leftJoin('account.role', 'role')
          .leftJoinAndSelect('account.class', 'class')
          .leftJoinAndSelect('account.institua', 'institua')
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
            gender: teacher.gender,
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
      await connection.manager.transaction(async transactionManager => {
        const createdStudents = await BlueBird.map(data, async (account: any) => {
          const accountRepository = connection.getRepository(Account);
          const shareAccount = await accountRepository.findOne({ username: account['Mã Học viên'] });
          if (shareAccount) {
            return res.status(400).json({ error: `Tài khoản '${account['Mã Học viên']}' đã tồn tại` });
          }

          const classRepository = connection.getRepository(Class);
          const classDb = await classRepository.findOne({ name: account['Lớp'] });
          if (!classDb) {
            res.status(400).json({ error: 'Lớp không hợp lệ'});
          }
          
          const salt = await bcrypt.genSalt(Number(process.env.SALT_NUMBER));
          const hashedPassword = await bcrypt.hash(account.msv, salt);

          const genders: { value: string; label: string; }[] = [{ value: 'male', label: 'Nam'}, { value: 'female', label: 'Nữ' }];

          const formatDate = moment(account['Ngày sinh'], 'YYYY-MM-DD').format();

          const student = new Account();
          student.username = account['Mã Học viên'];
          student.name = account['Họ và tên'];
          student.address = account['Địa chỉ'];
          student.email = account['Email'];
          student.phone = account['Số điện thoại'];
          student.classId = classDb.id;
          student.instituaId = classDb.instituaId;
          student.roleId = 1;
          student.password = hashedPassword;
          student.birthday = moment(formatDate).toISOString();
          student.gender = genders.find(gender => gender.label === account['Giới tính']).value as 'male' | 'female';

          return await transactionManager.save(student);
        });
        fs.unlink(req.file.path, (err) => {
          if (err) return res.status(500).json({ error: 'Internal Server Error'});
        });
      });

      return res.status(201).json({ message: 'success' });
    } catch (error) {
      fs.unlink(req.file.path, (err) => {
        if (err) return res.status(500).json({ error: 'Internal Server Error' });
      });

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
        const created = await BlueBird.map(data, async (account: any) => {
          const accountRepository = connection.getRepository(Account);
            const shareAccount = await accountRepository.findOne({ username: account['Email'] });
            if (shareAccount) {
              return res.status(400).json({ error: `Tài khoản '${account['Email']}' đã tồn tại` });
            }
  
          const instituaRepository = connection.getRepository(Institua);
          const institua = await instituaRepository.findOne({ name: account['Đơn vị'] });
          
          if (!institua) {
            return res.status(400).json({ error: 'Đơn vị không hợp lệ'});
          }

          const genders: { value: string; label: string; }[] = [{ value: 'male', label: 'Nam'}, { value: 'female', label: 'Nữ' }];
          
          const salt = await bcrypt.genSalt(Number(process.env.SALT_NUMBER));
          const hashedPassword = await bcrypt.hash(account.phone, salt);

          const formatDate = moment(account['Ngày sinh'], 'YYYY-MM-DD').format();

          const teacher = new Account();
          teacher.username = account['Email'];
          teacher.name = account['Họ và tên'];
          teacher.address = account['Địa chỉ'];
          teacher.email = account['Email'];
          teacher.phone = account['Số điện thoại'];
          teacher.instituaId = institua.id;
          teacher.roleId = 2;
          teacher.password = hashedPassword;
          teacher.birthday = moment(formatDate).toISOString();
          teacher.gender = genders.find(gender => gender.label === account['Giới tính']).value as 'male' | 'female';

          await transactionManager.save(teacher);
        });
  
        fs.unlink(req.file.path, (err) => {
          if (err) return res.status(500).json({ error: err });
        });

        return created;
      });

      return res.status(201).json({ message: 'success' });
    } catch (error) {
      fs.unlink(req.file.path, (err) => {
        if (err) return res.status(500).json({ error: err });
        return res.status(500).json({ error: error.message });
      });
    }
  }

  public async createStudent(req: Request, res: Response) {
    const body: ICreateUser = req.body;
    const connection = await PostgresDb.getConnection();
    
    try {
      await connection.manager.transaction(async transactionManager => {
        if (!body.msv) {
          return res.status(400).json({ error: 'Mã học viên không được bỏ trống'});
        }

        const accountRepository = connection.getRepository(Account);
        const account = await accountRepository.findOne({ username: body.msv });

        if (account) {
          return res.status(400).json({ error: 'Học viên đã tồn tại'});
        }

        if (!body.phone) {
          return res.status(400).json({ error: 'Số điện thoại không được bỏ trống'});
        }

        if (!body.name) {
          return res.status(400).json({ error: 'Tên học viên không được bỏ trống'});
        }

        if (!body.address) {
          return res.status(400).json({ error: 'Địa chỉ không được bỏ trống'});
        }

        const classRepositopry = connection.getRepository(Class);
        const classHCMA = await classRepositopry.findOne({ id: body.classId })

        const classRepository = connection.getRepository(Class);
        const classDb = await classRepository.findOne({ id: body.classId });
        if (!classDb) {
          res.status(400).json({ error: 'Lớp không hợp lệ'});
        }
        
        const salt = await bcrypt.genSalt(Number(process.env.SALT_NUMBER));
        const hashedPassword = await bcrypt.hash(body.msv, salt);

        const student = new Account();
        student.username = body.msv;
        student.name = body.name;
        student.address = body.address;
        student.email = `${body.msv}@hcma.edu.vn`;
        student.phone = body.phone;
        student.classId = body.classId;
        student.instituaId = classHCMA.instituaId;
        student.roleId = 1;
        student.password = hashedPassword;
        student.birthday = body.birthday;
        student.gender = body.gender;

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
        if (!body.email) {
          return res.status(400).json({ error: 'Email không được bỏ trống'});
        }

        const accountRepository = connection.getRepository(Account);
        const account = await accountRepository.findOne({ username: body.email });

        if (account) {
          return res.status(400).json({ error: 'Tài khoản đã tồn tại'});
        }

        if (!body.phone) {
          return res.status(400).json({ error: 'Số điện thoại không được bỏ trống'});
        }

        if (!body.phone) {
          return res.status(400).json({ error: 'Số điện thoại không được bỏ trống'});
        }

        if (!body.phone) {
          return res.status(400).json({ error: 'Số điện thoại không được bỏ trống'});
        }
        const instituaRepository = connection.getRepository(Institua);
        const institua = await instituaRepository.findOne({ id: body.instituaId });
        
        if (!institua) {
          res.status(400).json({ error: 'Viện không hợp lệ'});
        }
        
        const salt = await bcrypt.genSalt(Number(process.env.SALT_NUMBER));
        const hashedPassword = await bcrypt.hash(body.phone, salt);

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

  public updateInfo = async (req: Request, res: Response) => {
    const body: IUpdateInfo = req.body;

    try {
      const accountrepo = await getRepository(Account);
      const account = await accountrepo.findOne({ id: body.id });

      if (!account) {
        return res.status(404).json({ error: 'Tài khoản không tồn tại' });
      }

      if (body.instituaId) account.instituaId = body.instituaId;
      if (body.name) account.name = body.name;
      if (body.email) account.email = body.email;
      if (body.phone) account.phone = body.phone;
      if (body.birthday) account.birthday = body.birthday;
      if (body.classId) account.classId = body.classId;
      if (body.gender) account.gender = body.gender as 'male' | 'female';
      if (body.birthday) account.birthday = body.birthday;
      if (body.address) account.address = body.address;

      await accountrepo.save(account);

      return res.status(200).json({ message: 'Cập thông tin thành công '});
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

