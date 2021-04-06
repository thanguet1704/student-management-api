import PostgresDb from '../common/postgresDb';
import { StudentRepository } from '../reposiroties';

export const getStudents = async () => {
  const connection = await PostgresDb.getConnection();
  const studentRepository = await connection.getCustomRepository(StudentRepository);
  const students = await studentRepository.getStudents();
  return students;
};
