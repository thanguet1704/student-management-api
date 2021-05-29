import { Request, Response } from 'express';
import dotenv from 'dotenv';
import nodeMailer from 'nodemailer';
import { IRequestSendMail } from '../interfaces/sendMail';

dotenv.config();


export default class SendEmailController {
    public sendEmail = async (req: Request, res: Response) => {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const mailHost = process.env.MAIL_HOST;

        const body: IRequestSendMail = req.body; 
    
        const transported = nodeMailer.createTransport({
            service: 'gmail',
            auth: {
                user: adminEmail,
                pass: adminPassword,
            }
        });

        console.log(adminEmail, adminPassword);

        const mainOptions = {
            from: adminEmail,
            to: body.to,
            secure: false,
            subject: body.subject,
            html: `<p>Bạn có một tin nhắn mới</b>
            <ul><li>Username:' + ${body.name} + '</li><li>Email:' + req.body.email + '</li><li>Username:' + ${body.message} + '</li></ul>`
        };

        try {
            const info = await transported.sendMail(mainOptions);

        return res.status(200).json(info);
        } catch (error) {
            return res.status(500).json(error);
        }
        
    }
  }