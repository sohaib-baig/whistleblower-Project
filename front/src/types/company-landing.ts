export interface CompanyLanding {
  id: string;
  slug: string;
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  aboutUs: CompanyContent;
  privacyPolicy: CompanyContent;
  termsConditions: CompanyContent;
  support: CompanyContent;
  contactInfo: CompanyContact;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyContent {
  title: string;
  content: string;
  sections: ContentSection[];
  lastUpdated: string;
}

export interface ContentSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface CompanyContact {
  email: string;
  phone: string;
  phoneHoursFrom?: string;
  phoneHoursTo?: string;
  phoneHoursFormat?: '12h' | '24h';
  address: string;
  physicalAddress?: string;
  website: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

export interface CaseFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  attachments: File[];
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}
