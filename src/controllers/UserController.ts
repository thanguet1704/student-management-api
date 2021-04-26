import { Request, Response } from 'express';
import { EntityRepository, Repository } from 'typeorm';
import PostgresDb from '../common/postgresDb';
import { Account } from '../models';

@EntityRepository(Account)
export default class ClassController extends Repository<Account>{
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
}

