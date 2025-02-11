export interface User {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateInput {
  email: string;
  password: string;
  name?: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
}
