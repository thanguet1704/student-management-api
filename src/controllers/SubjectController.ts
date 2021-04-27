import { Request, Response } from 'express';
import { EntityRepository, Repository } from 'typeorm';
import { Category, Subject } from '../models';
import PostgresDb from '../common/postgresDb';

@EntityRepository(Subject)
export default class SubjectController extends Repository<Subject>{
  public getSubjects = async (req: Request, res: Response) => {
    const connection = await PostgresDb.getConnection();
    const subjectRepository = connection.getRepository(Subject);

    const subjects = await subjectRepository.find();

    res.status(200).json(subjects);
  }

  public getCategories = async (req: Request, res: Response) => {
    const subjectId = req.params.subjectId;
    const connection = await PostgresDb.getConnection();
    const categoryRepository = connection.getRepository(Category);

    const categories = await categoryRepository.createQueryBuilder('category')
      .leftJoin('category.subject', 'subject')
      .where('subject.id = :subjectId', { subjectId })
      .getMany();

    const results = categories.map(category => ({
      id: category.id,
      title: category.title,
      lession: category.lession,
    }));

    res.status(200).json(results);
  }
}
