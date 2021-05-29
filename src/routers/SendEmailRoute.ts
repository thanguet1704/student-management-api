import express from 'express';
import { SendMailController } from '../controllers';

export const sendEmailRoute = express.Router();

const sendMailController = new SendMailController();

sendEmailRoute.post('/', sendMailController.sendEmail);
