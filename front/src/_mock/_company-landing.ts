import type { CompanyLanding, LanguageOption } from 'src/types/company-landing';

export const _companyLanding: CompanyLanding = {
  id: '1',
  slug: 'abc',
  name: 'ABC Corporation',
  logo: '/assets/images/company/abc-logo.png',
  primaryColor: '#1976d2',
  secondaryColor: '#42a5f5',
  aboutUs: {
    title: 'About ABC Corporation',
    content:
      'We are a leading technology company dedicated to providing innovative solutions for businesses worldwide. With over 15 years of experience in the industry, we have established ourselves as a trusted partner for digital transformation.',
    sections: [
      {
        id: '1',
        title: 'Our Mission',
        content:
          'To provide innovative technology solutions that empower businesses to achieve their goals and drive growth in the digital age.',
        order: 1,
      },
      {
        id: '2',
        title: 'Our Vision',
        content:
          'To be the global leader in technology solutions, recognized for our innovation, reliability, and commitment to customer success.',
        order: 2,
      },
      {
        id: '3',
        title: 'Our Values',
        content:
          'We believe in integrity, innovation, collaboration, and excellence. These values guide everything we do and shape our company culture.',
        order: 3,
      },
      {
        id: '4',
        title: 'Our Team',
        content:
          'Our diverse team of 200+ professionals brings together expertise in technology, business, and customer service to deliver exceptional results.',
        order: 4,
      },
    ],
    lastUpdated: '2024-01-15',
  },
  privacyPolicy: {
    title: 'Privacy Policy',
    content:
      'This Privacy Policy describes how ABC Corporation collects, uses, and protects your personal information when you use our services.',
    sections: [
      {
        id: '1',
        title: 'Information We Collect',
        content:
          'We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.',
        order: 1,
      },
      {
        id: '2',
        title: 'How We Use Your Information',
        content:
          'We use the information we collect to provide, maintain, and improve our services, communicate with you, and ensure security.',
        order: 2,
      },
      {
        id: '3',
        title: 'Information Sharing',
        content:
          'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.',
        order: 3,
      },
      {
        id: '4',
        title: 'Data Security',
        content:
          'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
        order: 4,
      },
    ],
    lastUpdated: '2024-01-10',
  },
  termsConditions: {
    title: 'Terms and Conditions',
    content:
      'These Terms and Conditions govern your use of ABC Corporation services. By using our services, you agree to be bound by these terms.',
    sections: [
      {
        id: '1',
        title: 'Acceptance of Terms',
        content:
          'By accessing and using our services, you accept and agree to be bound by the terms and provision of this agreement.',
        order: 1,
      },
      {
        id: '2',
        title: 'Use License',
        content:
          'Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.',
        order: 2,
      },
      {
        id: '3',
        title: 'Disclaimer',
        content:
          'The materials on our website are provided on an "as is" basis. ABC Corporation makes no warranties, expressed or implied.',
        order: 3,
      },
      {
        id: '4',
        title: 'Limitations',
        content:
          'In no event shall ABC Corporation or its suppliers be liable for any damages arising out of the use or inability to use the materials.',
        order: 4,
      },
    ],
    lastUpdated: '2024-01-12',
  },
  support: {
    title: 'Support Center',
    content:
      'We are here to help you succeed. Our support team is available 24/7 to assist you with any questions or issues you may have.',
    sections: [
      {
        id: '1',
        title: 'Contact Information',
        content:
          'Reach out to us via email, phone, or live chat. Our support team is available around the clock to assist you.',
        order: 1,
      },
      {
        id: '2',
        title: 'FAQ',
        content:
          'Find answers to frequently asked questions about our services, billing, and technical support.',
        order: 2,
      },
      {
        id: '3',
        title: 'Documentation',
        content:
          'Access our comprehensive documentation, tutorials, and guides to help you get the most out of our services.',
        order: 3,
      },
      {
        id: '4',
        title: 'Community Forum',
        content:
          'Join our community forum to connect with other users, share experiences, and get help from the community.',
        order: 4,
      },
    ],
    lastUpdated: '2024-01-14',
  },
  contactInfo: {
    email: 'support@abccorp.com',
    phone: '+1 (555) 123-4567',
    phoneHoursFrom: '09:00',
    phoneHoursTo: '18:00',
    address: '123 Business Street, Suite 100, New York, NY 10001',
    physicalAddress: '123 Business Street, Suite 100, New York, NY 10001',
    website: 'https://www.abccorp.com',
    socialMedia: {
      facebook: 'https://facebook.com/abccorp',
      twitter: 'https://twitter.com/abccorp',
      linkedin: 'https://linkedin.com/company/abccorp',
      instagram: 'https://instagram.com/abccorp',
    },
  },
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

export const _languageOptions: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export const _companyCategories = [
  'General Inquiry',
  'Technical Support',
  'Billing Question',
  'Feature Request',
  'Bug Report',
  'Account Issue',
  'Partnership',
  'Other',
];

export const _priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];
