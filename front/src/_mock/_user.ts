import type { User } from 'src/types/user';

import { fSub } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export const _user: User = {
  id: 'e99f09a7-dd88-49d5-b1c8-1daf80c2d7b2',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@company.com',
  phoneNumber: '+1-555-0123',
  dateOfBirth: '1990-05-15',
  gender: 'male',
  bio: 'Experienced software developer with a passion for creating innovative solutions. I love working with modern technologies and building user-friendly applications.',
  address: {
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    postalCode: '10001',
  },
  profilePicture: '/assets/images/avatar/avatar_1.jpg',
  coverPhoto: '/assets/images/cover/cover_1.jpg',
  website: 'https://johndoe.dev',
  socialMedia: {
    linkedin: 'https://linkedin.com/in/johndoe',
    twitter: 'https://twitter.com/johndoe',
    facebook: 'https://facebook.com/johndoe',
    instagram: 'https://instagram.com/johndoe',
  },
  username: 'johndoe',
  emailNotifications: true,
  smsNotifications: false,
  marketingEmails: true,
  createdAt: fSub({ days: 30 }),
  updatedAt: fSub({ days: 1 }),
};

export const _users: User[] = [
  _user,
  {
    id: 'e99f09a7-dd88-49d5-b1c8-1daf80c2d7b3',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@company.com',
    phoneNumber: '+1-555-0124',
    dateOfBirth: '1988-03-22',
    gender: 'female',
    bio: 'Product manager with expertise in user experience and business strategy.',
    address: {
      street: '456 Oak Avenue',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
      postalCode: '94102',
    },
    profilePicture: '/assets/images/avatar/avatar_2.jpg',
    coverPhoto: '/assets/images/cover/cover_2.jpg',
    website: 'https://janesmith.com',
    socialMedia: {
      linkedin: 'https://linkedin.com/in/janesmith',
      twitter: 'https://twitter.com/janesmith',
      facebook: 'https://facebook.com/janesmith',
      instagram: 'https://instagram.com/janesmith',
    },
    username: 'janesmith',
    emailNotifications: true,
    smsNotifications: true,
    marketingEmails: false,
    createdAt: fSub({ days: 25 }),
    updatedAt: fSub({ days: 2 }),
  },
  {
    id: 'e99f09a7-dd88-49d5-b1c8-1daf80c2d7b4',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@company.com',
    phoneNumber: '+1-555-0125',
    dateOfBirth: '1992-11-08',
    gender: 'male',
    bio: 'Full-stack developer specializing in React and Node.js applications.',
    address: {
      street: '789 Pine Street',
      city: 'Seattle',
      state: 'WA',
      country: 'United States',
      postalCode: '98101',
    },
    profilePicture: '/assets/images/avatar/avatar_3.jpg',
    coverPhoto: '/assets/images/cover/cover_3.jpg',
    website: 'https://mikejohnson.dev',
    socialMedia: {
      linkedin: 'https://linkedin.com/in/mikejohnson',
      twitter: 'https://twitter.com/mikejohnson',
      facebook: 'https://facebook.com/mikejohnson',
      instagram: 'https://instagram.com/mikejohnson',
    },
    username: 'mikejohnson',
    emailNotifications: false,
    smsNotifications: true,
    marketingEmails: true,
    createdAt: fSub({ days: 20 }),
    updatedAt: fSub({ days: 3 }),
  },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const COUNTRY_OPTIONS = [
  { value: 'United States', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Japan', label: 'Japan' },
  { value: 'China', label: 'China' },
  { value: 'India', label: 'India' },
  { value: 'Brazil', label: 'Brazil' },
];

export const USER_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'banned', label: 'Banned' },
];

export const _userList = _users.map((user) => ({
  id: user.id,
  name: `${user.firstName} ${user.lastName}`,
  email: user.email,
  phoneNumber: user.phoneNumber,
  avatar: user.profilePicture,
  avatarUrl: user.profilePicture,
  role: 'User',
  status: 'active',
  company: 'Tech Corp',
  country: user.address.country || null,
  address: `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.state || ''}`,
  state: user.address.state || '',
  city: user.address.city || '',
  zipCode: user.address.postalCode || '',
  isVerified: true,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
}));

export const _userCards = _users.map((user) => ({
  id: user.id,
  name: `${user.firstName} ${user.lastName}`,
  email: user.email,
  avatar: user.profilePicture,
  avatarUrl: user.profilePicture,
  phoneNumber: user.phoneNumber,
  role: 'User',
  coverUrl: user.coverPhoto,
  totalFollowers: Math.floor(Math.random() * 1000) + 100,
  totalFollowing: Math.floor(Math.random() * 500) + 50,
  totalPosts: Math.floor(Math.random() * 100) + 10,
  address: user.address,
  status: 'active',
}));

export const _userPlans = [
  {
    subscription: 'Basic Plan',
    price: 0,
    primary: true,
  },
  {
    subscription: 'Pro Plan',
    price: 29,
    primary: false,
  },
  {
    subscription: 'Enterprise Plan',
    price: 99,
    primary: false,
  },
];

export const _userPayment = [
  {
    id: '1',
    cardNumber: '**** **** **** 1234',
    cardType: 'visa',
    expiryDate: '12/25',
    holderName: 'John Doe',
  },
];

export const _userInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-001',
    date: '2024-01-15',
    amount: 29.99,
    price: 29.99,
    status: 'paid',
    createdAt: fSub({ days: 30 }),
  },
  {
    id: '2',
    invoiceNumber: 'INV-002',
    date: '2024-02-15',
    amount: 29.99,
    price: 29.99,
    status: 'pending',
    createdAt: fSub({ days: 15 }),
  },
];

export const _userAddressBook = [
  {
    id: '1',
    name: 'Home',
    fullAddress: '123 Main St, New York, NY 10001',
    address: '123 Main St, New York, NY 10001',
    phone: '+1 555-0123',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Office',
    fullAddress: '456 Business Ave, New York, NY 10002',
    address: '456 Business Ave, New York, NY 10002',
    phone: '+1 555-0124',
    isDefault: false,
  },
];

export const _userAbout = {
  id: '1',
  cover: '/assets/images/cover/cover_1.jpg',
  position: 'Full Stack Developer',
  follower: 1234,
  following: 567,
  quote: 'Passionate about creating amazing user experiences.',
  country: 'United States',
  email: 'john.doe@company.com',
  company: 'Tech Corp',
  school: 'University of Technology',
  socialLinks: {
    facebook: 'https://facebook.com/johndoe',
    instagram: 'https://instagram.com/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe',
    twitter: 'https://twitter.com/johndoe',
  },
};
