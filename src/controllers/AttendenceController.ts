import dotenv from 'dotenv';
import { Request, Response } from 'express';
import csv from 'csv-parse';
import fs from 'fs';

dotenv.config();

export default class AttendenceController {
  public createAttendence = async (req: Request, res: Response) => {
    let results: any[] = [];
    console.log(req.file.path);
    
    var obj;
    fs.readFile('file', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
    });
  }
}