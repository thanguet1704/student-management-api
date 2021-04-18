export interface ICreateScheduleRequest {
    categoryId: number;
    classId: number;
    date: Date;
    session: 'morning' | 'afternoon';
    accountId: number;
    startDate: Date;
    endDate: Date;
}