// ----------------------------------------------------------------------

export type IIntegrationItem = {
  id: string;
  name: string;
  endpoint: string;
  appKey: string;
  appSecret: string;
  status: 'active' | 'inactive';
  createdAt: string | null;
  updatedAt: string | null;
  description?: string;
  lastSyncAt?: string | null;
  totalRequests?: number;
  successRate?: number;
};

export type IIntegrationFilters = {
  status: string[];
  search: string;
};

export type IIntegrationCreateData = {
  name: string;
  endpoint: string;
  appKey: string;
  appSecret: string;
  description?: string;
};

export type IIntegrationUpdateData = IIntegrationCreateData & {
  id: string;
  status?: 'active' | 'inactive';
};
