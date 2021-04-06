import { EntityRepository, Repository } from 'typeorm';
import { Account } from '../models';

/**
 * Gets list form for more account
 *
 * accounts (Optional) Array<string> (example: account_id,account_id,...)
 * actions  (Optional) Array<string>
 * returns list of form
 * */
@EntityRepository(Account)
export default class StudentRepository extends Repository<Account> {
  public async getStudents(){
    const students = await this.find();
    return students;
  }
}
