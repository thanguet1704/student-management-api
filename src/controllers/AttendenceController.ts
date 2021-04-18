import dotenv from 'dotenv';
import { Request, Response } from 'express';
import fs from 'fs';
import csvtojson from 'csvtojson';

dotenv.config();

export default class AttendenceController {
  public createAttendence = async (req: Request, res: Response) => {
    let results: any[] = [];
    console.log(req.file.path);
    csvtojson()
      .fromFile(req.file.path)
      .then((json) => {
        console.log(json);
      });
  }
}