import type { CardProps } from '@mui/material/Card';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import TableContainer from '@mui/material/TableContainer';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  list: {
    id: string;
    name: string;
    phone: string;
    address: string;
    date: string;
  }[];
};

export function AnalyticsLatestCompanies({ title, subheader, list, sx, ...other }: Props) {
  const { t } = useTranslate('navbar');

  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} />

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('dashboard.analytics.charts.tableHeaders.name')}</TableCell>
              <TableCell>{t('dashboard.analytics.charts.tableHeaders.phone')}</TableCell>
              <TableCell>{t('dashboard.analytics.charts.tableHeaders.address')}</TableCell>
              <TableCell>{t('dashboard.analytics.charts.tableHeaders.date')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((company) => (
              <TableRow key={company.id}>
                <TableCell>{company.name}</TableCell>
                <TableCell>{company.phone}</TableCell>
                <TableCell>{company.address}</TableCell>
                <TableCell>{company.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
