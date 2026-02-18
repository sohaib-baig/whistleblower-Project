# Financial Report API Documentation

## Overview
The Financial Report API endpoint provides comprehensive financial analytics based on Manual Entry data. It aggregates data by media buyers (accounts) and generates daily, monthly totals for cost, revenue, ROI, and net profit.

## Endpoint

```
GET /api/v1/manual_entries/reports/financial
```

## Authentication & Authorization
- **Authentication**: Required (Sanctum session-based)
- **Middleware**: `auth:sanctum`, `role:admin`, `verified`, `reject.banned`, `throttle:api`
- **Permission**: Requires `manual_entries.view` permission or `admin` role
- **Policy**: Uses `ManualEntryPolicy::viewAny()`

## Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `month` | string | No | Current month | Month filter in format `Y-m` (e.g., `2024-10`) |
| `accounts` | array | No | All accounts | Array of media buyer names to filter by |
| `accounts.*` | string | No | - | Individual media buyer name (must exist in users table) |

### Example Requests

**Get current month report:**
```bash
GET /api/v1/manual_entries/reports/financial
```

**Get specific month report:**
```bash
GET /api/v1/manual_entries/reports/financial?month=2024-10
```

**Filter by specific accounts:**
```bash
GET /api/v1/manual_entries/reports/financial?accounts[]=Media%20Buyer%20One&accounts[]=Media%20Buyer%20Two
```

**Combined filters:**
```bash
GET /api/v1/manual_entries/reports/financial?month=2024-10&accounts[]=Media%20Buyer%20One
```

## Response Structure

### Success Response (200)

```json
{
  "status": true,
  "message": "Financial report retrieved successfully",
  "data": {
    "accounts": [
      {
        "account": "Media Buyer Name",
        "campaigns": [
          {
            "campaign": "Cost",
            "monthly": {
              "type": "MTD Actual",
              "cost": 1063.50
            },
            "daily": [
              {
                "date": "1-Oct",
                "cost": 100.00
              },
              {
                "date": "2-Oct",
                "cost": 105.00
              }
              // ... up to day 31 (depending on month)
            ]
          },
          {
            "campaign": "Revenue",
            "monthly": {
              "type": "MTD Actual",
              "revenue": 1270.00
            },
            "daily": [
              {
                "date": "1-Oct",
                "revenue": 120.00
              }
              // ... for all days
            ]
          },
          {
            "campaign": "ROI",
            "monthly": {
              "type": "MTD Actual",
              "roi": 19.47
            },
            "daily": [
              {
                "date": "1-Oct",
                "roi": 20.00
              }
              // ... for all days
            ]
          },
          {
            "campaign": "Net",
            "monthly": {
              "type": "MTD Actual",
              "net": 207.50
            },
            "daily": [
              {
                "date": "1-Oct",
                "net": 20.00
              }
              // ... for all days
            ]
          }
        ]
      }
      // ... more accounts
    ],
    "totals": {
      "account": "Totals",
      "campaigns": [
        // Same structure as account campaigns
        // Contains aggregated totals for all accounts
      ]
    }
  }
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "status": false,
  "message": "Unauthenticated."
}
```

**403 Forbidden**
```json
{
  "status": false,
  "message": "This action is unauthorized."
}
```

**422 Validation Error**
```json
{
  "status": false,
  "message": "The given data was invalid.",
  "data": {
    "errors": {
      "month": ["The month field must match the format Y-m."],
      "accounts.0": ["The selected accounts.0 is invalid."]
    }
  }
}
```

## Data Mapping

### From Manual Entry to Financial Report

| Manual Entry Field | Report Field | Description |
|-------------------|--------------|-------------|
| `media_buyer` → `name` | `account` | Media buyer name becomes the account name |
| `report_date` | Daily row date | Date of the manual entry |
| `total_spend` | Cost row | Total spend for the day |
| `total_revenue` | Revenue row | Total revenue for the day |
| `total_profit` | Net row | Total profit (revenue - cost) |
| `margins` | ROI row | Profit margin percentage |

### Calculation Logic

**ROI Calculation:**
```php
ROI = (Net / Cost) * 100
```

**Net Calculation:**
```php
Net = Revenue - Cost
```

**Monthly Aggregation:**
- Sums all daily values within the selected month for each metric

**Daily Aggregation:**
- For each day (1-31), sums all entries for that specific date
- Returns 0 for days with no data

## Response Details

### Accounts Array
- Each element represents one media buyer
- Contains 4 campaigns: Cost, Revenue, ROI, Net
- Each campaign has:
  - `monthly`: MTD (Month-To-Date) actual values
  - `daily`: Array of daily values for all days in the month

### Totals Object
- Aggregates all accounts into a single "Totals" row
- Same structure as individual accounts
- Appears first in the table display

### Date Format
- Daily dates use format: `D-Mon` (e.g., "1-Oct", "15-Nov")
- Shows day number and 3-letter month abbreviation

## Performance Considerations

- Query uses eager loading for media buyer relationships
- Filters data before aggregation to minimize memory usage
- Uses collection methods for efficient grouping and calculations
- Indexes recommended on:
  - `manual_entries.media_buyer_id`
  - `manual_entries.report_date`

## Testing

Run the test suite:
```bash
php artisan test --filter=FinancialReportTest
```

### Test Coverage
- ✓ Generate report for current month
- ✓ Filter by specific month
- ✓ Filter by accounts
- ✓ ROI calculation accuracy
- ✓ Authentication requirement
- ✓ Permission requirement
- ✓ Daily data for all days in month
- ✓ Empty data handling

## Security Checklist

- ✅ **Authentication**: Sanctum session-based auth required
- ✅ **Authorization**: Policy checks via `ManualEntryPolicy::viewAny()`
- ✅ **Input Validation**: All inputs validated via FormRequest rules
- ✅ **SQL Injection**: Protected by Eloquent ORM
- ✅ **Mass Assignment**: Uses `$fillable` on models
- ✅ **Rate Limiting**: `throttle:api` middleware applied
- ✅ **CORS**: Configured for frontend domain only
- ✅ **Response Envelope**: Standard `{ status, message, data }` format
- ✅ **Error Handling**: Graceful error responses with appropriate HTTP codes
- ✅ **No PII Leakage**: Only returns aggregated financial data

## Frontend Integration

### Example API Call (TypeScript + Axios)

```typescript
import { apiClient } from 'src/api/axios';

interface FinancialReportParams {
  month?: string; // Format: "2024-10"
  accounts?: string[];
}

export const getFinancialReport = async (params?: FinancialReportParams) => {
  const response = await apiClient.get('/manual_entries/reports/financial', {
    params
  });
  return response.data;
};

// Usage
const report = await getFinancialReport({
  month: '2024-10',
  accounts: ['Media Buyer One']
});
```

### Expected Response Type

```typescript
interface DailyData {
  date: string;
  cost?: number;
  revenue?: number;
  roi?: number;
  net?: number;
}

interface MonthlyData {
  type: 'MTD Actual';
  cost?: number;
  revenue?: number;
  roi?: number;
  net?: number;
}

interface Campaign {
  campaign: 'Cost' | 'Revenue' | 'ROI' | 'Net';
  monthly: MonthlyData;
  daily: DailyData[];
}

interface Account {
  account: string;
  campaigns: Campaign[];
}

interface FinancialReportData {
  accounts: Account[];
  totals: {
    account: 'Totals';
    campaigns: Campaign[];
  };
}
```

## Acceptance Criteria

- ✅ API endpoint at `/api/v1/manual_entries/reports/financial`
- ✅ Returns standard envelope `{ status, message, data }`
- ✅ Requires authentication and `manual_entries.view` permission
- ✅ Filters by month (defaults to current month)
- ✅ Filters by accounts (media buyer names)
- ✅ First row shows totals for all selected data
- ✅ Subsequent rows show data grouped by media buyer
- ✅ Each account has 4 campaigns: Cost, Revenue, ROI, Net
- ✅ Monthly column shows MTD Actual values
- ✅ Daily columns show individual day values (1-31 based on month)
- ✅ ROI calculated correctly as `(Net / Cost) * 100`
- ✅ All numeric values rounded to 2 decimal places
- ✅ Date format: `D-Mon` (e.g., "1-Oct")
- ✅ Comprehensive test coverage (8 tests, 475 assertions)

## Version History

- **v1.0** - Initial implementation (2024-10-10)
  - Basic financial report generation
  - Month and account filtering
  - Daily and monthly aggregations
  - ROI calculations
  - Complete test coverage

