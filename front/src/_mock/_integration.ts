import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const INTEGRATION_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export const INTEGRATION_SORT_OPTIONS = [
  { label: 'Latest', value: 'latest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Name A-Z', value: 'name-asc' },
  { label: 'Name Z-A', value: 'name-desc' },
  { label: 'Status', value: 'status' },
];

export const INTEGRATION_PUBLISH_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

// Helper function to generate integration names
function generateIntegrationName(index: number): string {
  const names = ['TrackDrive', 'CPV Lab', 'LeadExec'];
  return names[index % names.length];
}

// Helper function to generate integration endpoints
function generateIntegrationEndpoint(index: number): string {
  const endpoints = [
    'https://api.salesforce.com/v1',
    'https://api.hubapi.com/v1',
    'https://api.stripe.com/v1',
  ];
  return endpoints[index % endpoints.length];
}

// Helper function to generate app keys
function generateAppKey(index: number): string {
  const prefixes = ['sk_', 'pk_', 'ak_', 'key_', 'app_'];
  const prefix = prefixes[index % prefixes.length];
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${prefix}${randomString}`;
}

// Helper function to generate app secrets
function generateAppSecret(index: number): string {
  const randomString = Math.random().toString(36).substring(2, 25);
  return `secret_${randomString}`;
}

// Helper function to generate descriptions
function generateDescription(index: number): string {
  const descriptions = [
    'Customer relationship management integration for sales automation',
    'Marketing automation platform for lead generation and nurturing',
    'Payment processing integration for secure transactions',
  ];
  return descriptions[index % descriptions.length];
}

// Helper function to generate success rate
function generateSuccessRate(index: number): number {
  return Math.round((85 + Math.random() * 15) * 10) / 10;
}

export const _integrationItems = Array.from({ length: 3 }, (_, index) => {
  const status = index % 3 ? 'active' : 'inactive';
  const isActive = status === 'active';

  return {
    id: _mock.id(index),
    name: generateIntegrationName(index),
    endpoint: generateIntegrationEndpoint(index),
    appKey: generateAppKey(index),
    appSecret: generateAppSecret(index),
    status: status as 'active' | 'inactive',
    description: generateDescription(index),
    createdAt: _mock.time(index),
    updatedAt: _mock.time(index + 1),
    lastSyncAt: isActive ? _mock.time(index + 2) : null,
    totalRequests: _mock.number.nativeL(index + 10),
    successRate: generateSuccessRate(index),
  };
});
