export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  mustChangePassword: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}
