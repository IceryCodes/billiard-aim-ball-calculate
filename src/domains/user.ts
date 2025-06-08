import { GenderType, UserRoleType } from './interface';

export interface UserLoginDto {
  email: string;
  password: string;
}

export interface UserVerifyDto {
  token: string;
}

export interface UserResendVerificationDto {
  _id: string;
}

export interface UserUpdateDto {
  _id: string;
  firstName: string;
  lastName: string;
  gender: GenderType;
}

export type UserRegisterDto = UserLoginDto & Omit<UserUpdateDto, '_id'>;

export interface UserWithPasswordProps extends UserRegisterDto {
  _id: string;
  role: UserRoleType;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserProps = Omit<UserWithPasswordProps, 'password'>;

export type UserUpdateProps = Omit<UserProps, '_id' | 'email' | 'role' | 'isVerified' | 'createdAt' | 'updatedAt'>;
export type DeleteUserDto = Pick<UserProps, '_id'>;

export type GetUserDto = Partial<Pick<UserProps, '_id'>>;

export type GetUsersDto = Pick<UserProps, 'email'>;
