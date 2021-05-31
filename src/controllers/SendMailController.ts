import { Request, Response } from 'express';
import dotenv from 'dotenv';
import nodeMailer from 'nodemailer';
import { IRequestSendMail } from '../interfaces/sendMail';

dotenv.config();


export default class SendEmailController {
    public sendEmail = async (req: Request, res: Response) => {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        const body: IRequestSendMail = req.body; 
    
        const transported = nodeMailer.createTransport({
            service: 'gmail',
            auth: {
                user: adminEmail,
                pass: adminPassword,
            }
        });

        const mainOptions = {
            from: adminEmail,
            to: body.to,
            secure: false,
            subject: body.subject,
            html: body.message,
        };

        if (!body.to || !body.subject || !body.message) {
            return res.status(400).json({ message: 'Không được bỏ trống' });
        }

        try {
            const info = await transported.sendMail(mainOptions);

        return res.status(200).json(info);
        } catch (error) {
            return res.status(500).json(error);
        }
        
    }
  }