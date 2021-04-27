export interface ICreateScheduleRequest {
    subjectId: number;
    categoryId: number;
    classId: number;
    learningDate: Date;
    sessionId: number;
    accountId: number;
    classroomId: number;
    startDate: Date;
    endDate: Date;
    finalExamDate: Date;
}