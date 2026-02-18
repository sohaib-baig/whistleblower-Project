import type { ICategoryItem } from 'src/types/category';

import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const CATEGORY_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const _categoryList: ICategoryItem[] = [
  {
    id: _mock.id(1),
    name: 'Competition law',
    status: 'active',
    createdAt: _mock.time(1),
    isActive: true,
  },
  {
    id: _mock.id(2),
    name: 'Conflict of interest',
    status: 'active',
    createdAt: _mock.time(2),
    isActive: true,
  },
  {
    id: _mock.id(3),
    name: 'Corruption',
    status: 'active',
    createdAt: _mock.time(3),
    isActive: true,
  },
  {
    id: _mock.id(4),
    name: 'Fraud',
    status: 'active',
    createdAt: _mock.time(4),
    isActive: true,
  },
  {
    id: _mock.id(5),
    name: 'Money laundering',
    status: 'active',
    createdAt: _mock.time(5),
    isActive: true,
  },
  {
    id: _mock.id(6),
    name: 'Other',
    status: 'active',
    createdAt: _mock.time(6),
    isActive: true,
  },
  {
    id: _mock.id(7),
    name: 'Harassment',
    status: 'inactive',
    createdAt: _mock.time(7),
    isActive: false,
  },
  {
    id: _mock.id(8),
    name: 'Discrimination',
    status: 'inactive',
    createdAt: _mock.time(8),
    isActive: false,
  },
];
