export interface ICreateScheduleRequest {
    categoryId: number;
    classId: number;
    time: Date;
    period: 'morning' | 'afternoon';
    accountId: number;
    startDate: Date;
    endDate: Date;
}