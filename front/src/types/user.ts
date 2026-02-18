import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bio?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  profilePicture: string;
  coverPhoto: string;
  website?: string;
  socialMedia: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  username: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  createdAt: IDateValue;
  updatedAt: IDateValue;
}

export interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bio?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  website?: string;
  socialMedia: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  username: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserTableFilters {
  name: string;
  email: string;
  status: string;
}

export interface IUserItem {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  avatar: string;
  avatarUrl: string;
  role: string;
  status: string;
  company: string;
  companyNumber?: string;
  country: string | null;
  address: string;
  physicalAddress?: string;
  phoneHoursFrom?: string;
  phoneHoursTo?: string;
  phoneHoursFormat?: '12h' | '24h';
  userLanguage?: string;
  state: string;
  city: string;
  zipCode: string;
  isVerified: boolean;
  createdAt: IDateValue;
  updatedAt: IDateValue;
}

// Alias for compatibility
export type UserItem = IUserItem;

export interface IUserCard {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatarUrl: string;
  phoneNumber: string;
  role: string;
  coverUrl: string;
  totalFollowers: number;
  totalFollowing: number;
  totalPosts: number;
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  status: string;
}

export interface IUserTableFilters {
  name: string;
  email?: string;
  role: string[];
  status: string;
}

export interface IUserAccountBillingHistory {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  price: number;
  status: string;
  createdAt: IDateValue;
}
