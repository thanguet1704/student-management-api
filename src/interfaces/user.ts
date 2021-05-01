export interface ICreateUsers {
    msv?: string;
    name: string;
    address: string;
    email: string;
    phone: string;
    khoa?: string;
    class?: string;
    institua?: string;
}

export interface ICreateUser {
    msv?: string;
    name: string;
    address: string;
    email: string;
    phone: string;
    schoolYearId?: number;
    classId?: number;
    instituaId: number;
}