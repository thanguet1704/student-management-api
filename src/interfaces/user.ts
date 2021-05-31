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
    classId?: number;
    instituaId?: number;
    birthday: string;
    gender: 'male' | 'female';
}

export interface IUpdateInfo {
    id: number;
    email?: string;
    name?: string;
    address?: string;
    phone?: string;
    birthday?: string;
    gender?: string;
    classId?: number;
    instituaId?: number;
}