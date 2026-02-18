// ----------------------------------------------------------------------

export type IRolePermission = {
  id: string;
  name: string;
  checked: boolean;
};

export type IRoleModule = {
  id: string;
  name: string;
  permissions: IRolePermission[];
};

export type IRoleFilters = {
  roles: string[];
  experience: string;
  benefits: string[];
  locations: string[];
  employmentTypes: string[];
};

export type IRoleCandidate = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
};

export type IRoleCompany = {
  name: string;
  logo: string;
  phoneNumber: string;
  fullAddress: string;
};

export type IRoleSalary = {
  type: string;
  price: number;
  negotiable: boolean;
};

export type IRoleItem = {
  id: string;
  role: string;
  title: string;
  content: string;
  publish: string;
  skills: string[];
  totalViews: number;
  experience: string;
  salary: IRoleSalary;
  benefits: string[];
  locations: string[];
  company: IRoleCompany;
  createdAt: string | null;
  employmentTypes: string[];
  workingSchedule: string[];
  expiredDate: string | null;
  candidates: IRoleCandidate[];
  permissions: IRoleModule[];
};
