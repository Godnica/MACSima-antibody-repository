export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  mustChangePassword: boolean;
}

export interface UserAdmin {
  id: number;
  username: string;
  display_name: string | null;
  role: 'admin' | 'user';
  must_change_password: boolean;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
