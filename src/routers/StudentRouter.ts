import express, { Response, Request } from 'express';

export const studentRouter = express.Router();

studentRouter.get('/attendence', ( req: Request, res: Response ) => {
    res.status(200).json({ token: req.cookies.hcmaid });
});
