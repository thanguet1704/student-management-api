import { Request, Response } from 'express';
import xlsx from 'xlsx';

export default class AttendenceController {
  public createAttendence = async (req: Request, res: Response) => {

    const file = xlsx.readFile(req.file.path, { cellDates: true, cellStyles: true });
    const file1 = file.Sheets[file.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(file1);
  }
}