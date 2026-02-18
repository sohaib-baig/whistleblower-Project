import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  list: {
    name: string;
    value: number;
  }[];
};

export function AnalyticsReportingChannels({ title, subheader, list, sx, ...other }: Props) {
  const maxValue = Math.max(...list.map((item) => item.value));

  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Box sx={{ p: 3 }}>
        {list.map((channel, index) => (
          <Box key={channel.name} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {channel.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {channel.value}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(channel.value / maxValue) * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        ))}
      </Box>
    </Card>
  );
}
