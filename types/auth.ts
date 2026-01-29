export type AppUserRole = 'ADMIN' | 'USER';

export type AppSessionUser = {
    id: string;
    email: string | null;
    name: string | null;
    role: AppUserRole;
};

export type AuthenticatedUser = AppSessionUser;

