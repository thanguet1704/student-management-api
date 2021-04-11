import express, { Response, Request } from 'express';

export const studentRoute = express.Router();

studentRoute.get('/attendence', ( req: Request, res: Response ) => {
    res.status(200).json({ token: req.cookies.hcmaid });
});
