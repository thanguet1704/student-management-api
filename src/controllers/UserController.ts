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

    

    try {
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
            class: {
              id: student.class.id,
              name: student.class.name,
            },
            institua: student.institua?.name,
            address: student.address,
            birthday: student.birthday,
            gender: student.gender,
            isActive: student.isActive,
            email: student.email,
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
              institua: {
                id: teacher.institua?.id,
                name: teacher.institua?.name,
              },
              email: teacher.email,
              phone: teacher.phone,
              address: teacher.address,
              gender: teacher.gender,
              birthday: teacher.birthday,
          }));
  
          return res.status(200).json({ totalPage:  Math.ceil(count / (limit > 0 ? limit : count)), data: results });
        }
            
        default:
          return res.status(500);
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
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
          
          const shareAccount = await accountRepository.findOne({ username: account['T??n ng?????i d??ng'] });
          if (shareAccount) {
            return res.status(400).json({ error: `T??i kho???n '${account['T??n ng?????i d??ng']}' ???? t???n t???i` });
          }

          const classRepository = connection.getRepository(Class);
          const classDb = await classRepository.findOne({ name: account['L???p'] });
          if (!classDb) {
            res.status(400).json({ error: 'L???p kh??ng h???p l???'});
          }
          
          console.log(account['M????t kh????u']);
          const salt = await bcrypt.genSalt(Number(process.env.SALT_NUMBER));
          const hashedPassword = await bcrypt.hash(account['M????t kh????u'], salt);

          // const genders: { value: string; label: string; }[] = [{ value: 'male', label: 'Nam'}, { value: 'female', label: 'N???' }];

          // const formatDate = moment(account['Ng??y sinh'], 'YYYY-MM-DD').format();

          const student = new Account();
          student.username = account['T??n ng?????i d??ng'];
          student.name = account['T??n hi???n th???'];
          // student.address = account['?????a ch???'];
          student.email = account['T??n ng?????i d??ng'];
          // student.phone = account['S??? ??i???n tho???i'];
          student.classId = classDb.id;
          // student.instituaId = classDb.instituaId;
          student.roleId = 1;
          student.password = hashedPassword;
          // student.birthday = moment(formatDate).toISOString();
          // student.gender = genders.find(gender => gender.label === account['Gi???i t??nh']).value as 'male' | 'female';

          return await transactionManager.save(student);
        });
        fs.unlink(req.file.path, (err) => {
          if (err) return res.status(500).json({ error: 'Internal Server Error'});
        });

        return createdStudents;
      });

      return res.status(201).json({ message: 'success' });
    } catch (error) {
      fs.unlink(req.file.path, (err) => {
        if (err) return res.status(500).json({ error: 'Internal Server Error' });
      });
      console.log(error);
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
            const shareAccount = await accountRepository.findOne({ username: account['T??n ng?????i d??ng'] });
            if (shareAccount) {
              return res.status(400).json({ error: `T??i kho???n '${account['T??n ngu???i d??ng']}' ???? t???n t???i` });
            }
  
          // const instituaRepository = connection.getRepository(Institua);
          // const institua = await instituaRepository.findOne({ name: account['????n v???'] });
          
          // if (!institua) {
          //   return res.status(400).json({ error: '????n v??? kh??ng h???p l???'});
          // }

          // const genders: { value: string; label: string; }[] = [{ value: 'male', label: 'Nam'}, { value: 'female', label: 'N???' }];
          
          const salt = await bcrypt.genSalt(Number(process.env.SALT_NUMBER));
          const hashedPassword = await bcrypt.hash(account['M????t kh????u'], salt);

          // const formatDate = moment(account['Ng??y sinh'], 'YYYY-MM-DD').format();

          const teacher = new Account();
          teacher.username = account['T??n ng?????i d??ng'];
          teacher.name = account['T??n hi???n th???'];
          // teacher.address = account['?????a ch???'];
          teacher.email = account['T??n ng?????i d??ng'];
          // teacher.phone = account['S??? ??i???n tho???i'];
          // teacher.instituaId = institua.id;
          teacher.roleId = 2;
          teacher.password = hashedPassword;
          // teacher.birthday = moment(formatDate).toISOString();
          // teacher.gender = genders.find(gender => gender.label === account['Gi???i t??nh']).value as 'male' | 'female';

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
        const accountRepository = connection.getRepository(Account);
        const account = await accountRepository.findOne({ username: body.msv });

        if (account) {
          return res.status(400).json({ error: 'H???c vi??n ???? t???n t???i'});
        }

        if (!body.phone) {
          return res.status(400).json({ error: 'S??? ??i???n tho???i kh??ng ???????c b??? tr???ng'});
        }

        if (!body.name) {
          return res.status(400).json({ error: 'T??n h???c vi??n kh??ng ???????c b??? tr???ng'});
        }

        if (!body.address) {
          return res.status(400).json({ error: '?????a ch??? kh??ng ???????c b??? tr???ng'});
        }

        const classRepositopry = connection.getRepository(Class);
        const classHCMA = await classRepositopry.findOne({ id: body.classId })

        const classRepository = connection.getRepository(Class);
        const classDb = await classRepository.findOne({ id: body.classId });
        if (!classDb) {
          res.status(400).json({ error: 'L???p kh??ng h???p l???'});
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
          return res.status(400).json({ error: 'Email kh??ng ???????c b??? tr???ng'});
        }

        const accountRepository = connection.getRepository(Account);
        const account = await accountRepository.findOne({ username: body.email });

        if (account) {
          return res.status(400).json({ error: 'T??i kho???n ???? t???n t???i'});
        }

        if (!body.phone) {
          return res.status(400).json({ error: 'S??? ??i???n tho???i kh??ng ???????c b??? tr???ng'});
        }

        if (!body.phone) {
          return res.status(400).json({ error: 'S??? ??i???n tho???i kh??ng ???????c b??? tr???ng'});
        }

        if (!body.phone) {
          return res.status(400).json({ error: 'S??? ??i???n tho???i kh??ng ???????c b??? tr???ng'});
        }
        const instituaRepository = connection.getRepository(Institua);
        const institua = await instituaRepository.findOne({ id: body.instituaId });
        
        if (!institua) {
          res.status(400).json({ error: 'Vi???n kh??ng h???p l???'});
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
        return res.status(404).json({ error: 'T??i kho???n kh??ng t???n t???i' });
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

      return res.status(200).json({ message: 'C???p th??ng tin th??nh c??ng '});
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  public getInfo = async (req: Request, res: Response) => {
    const id = Number(req.query.id);

    const account = await getRepository(Account).findOne({ id });

    const result = {
      id: account.id,
      name: account.name,
      classId: account.classId,
      address: account.address,
      phone: account.phone,
      birthday: account.birthday,
      gender: account.gender,
    };

    return res.status(200).json(result);
  }
}

