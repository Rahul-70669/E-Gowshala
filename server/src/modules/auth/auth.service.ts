import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from './auth.model';
import { env } from '../../config/env';

interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: IUser['role'];
  language?: IUser['language'];
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    language: string;
    avatar: string;
  };
  token: string;
}

const generateToken = (user: IUser): string => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

const formatUserResponse = (user: IUser, token: string): AuthResponse => ({
  user: {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    language: user.language,
    avatar: user.avatar || '',
  },
  token,
});

export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    const error = new Error('Email already registered') as any;
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(input.password, salt);

  const user = await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone || '',
    passwordHash,
    role: input.role || 'volunteer',
    language: input.language || 'en',
  });

  const token = generateToken(user);
  return formatUserResponse(user, token);
};

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    const error = new Error('Invalid email or password') as any;
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is deactivated. Contact administrator.') as any;
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password') as any;
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);
  return formatUserResponse(user, token);
};

export const getProfile = async (userId: string): Promise<Omit<AuthResponse, 'token'>> => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    const error = new Error('User not found') as any;
    error.statusCode = 404;
    throw error;
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      language: user.language,
      avatar: user.avatar || '',
    },
  };
};

export const getAllUsers = async (): Promise<any[]> => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    role: u.role,
    language: u.language,
    isActive: u.isActive,
    createdAt: u.createdAt,
  }));
};

export const updateUser = async (
  userId: string,
  updates: { name?: string; role?: IUser['role']; isActive?: boolean; phone?: string; language?: string }
): Promise<any> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-passwordHash');

  if (!user) {
    const error = new Error('User not found') as any;
    error.statusCode = 404;
    throw error;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    language: user.language,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
};

export const deleteUser = async (userId: string): Promise<void> => {
  const user = await User.findByIdAndUpdate(userId, { isActive: false });
  if (!user) {
    const error = new Error('User not found') as any;
    error.statusCode = 404;
    throw error;
  }
};
