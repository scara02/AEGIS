export interface User {
  id: number;
  username: string;
  role: string;
  full_name?: string;
  email?: string;
  avatar?: string;
  avatar_color?: string;
  initials?: string;
  avatar_type?: string;
  password?: string;
}
