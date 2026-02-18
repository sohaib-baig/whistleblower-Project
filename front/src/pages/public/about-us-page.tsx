import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function PublicAboutUsPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleLanguageChange = (event: any) => {
    setSelectedLanguage(event.target.value);
  };

  return (
    <>
      <Helmet>
        <title>{`About Us - ${CONFIG.appName}`}</title>
      </Helmet>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          px: 3,
          py: 2,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          {/* Logo and Title */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.2rem',
              }}
            >
              ABC
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              ABC Company
            </Typography>
          </Stack>

          {/* Language Selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              displayEmpty
              variant="outlined"
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="sv">Swedish</MenuItem>
              <MenuItem value="no">Norwegian</MenuItem>
              <MenuItem value="da">Danish</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ px: 3 }}>
          <Tab label="Home" />
          <Tab label="Guide for reporting" />
        </Tabs>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
        <Card sx={{ p: 4 }}>
          <Stack spacing={4}>
            {/* Title */}
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Lewinowitz Whistleblower Channel
            </Typography>

            {/* Introduction */}
            <Typography variant="body1" color="text.secondary">
              As an employee, you can report serious matters anonymously or if you have reasonable
              suspicion of such matters.
            </Typography>

            {/* Anonymous Reporting Section */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Anonymous reporting of serious matters
              </Typography>
              <Stack spacing={2}>
                <Typography variant="body1">
                  Through this page, you can submit information about reprehensible matters or
                  report actions that are unethical, illegal or in violation of internal policies.
                  The scheme is to be used to bring matters to light that would not otherwise have
                  come to light.
                </Typography>
                <Typography variant="body1">
                  It can be reported confidentially with indication of name and contact information
                  or, if desired, 100% anonymously. All inquiries are treated confidentially and
                  securely.
                </Typography>
              </Stack>
            </Box>

            {/* HR Related Matters */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                HR related matters
              </Typography>
              <Typography variant="body1">
                HR matters cannot be reported through this system and should be discussed with
                management or HR.
              </Typography>
            </Box>

            {/* Call to Action */}
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              From this page you are able to make a new secure report or follow up on an existing
              report.
            </Typography>

            {/* Follow Up Section */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Following up on your reports can be relevant for numerous reasons:
              </Typography>
              <Stack component="ol" spacing={1} sx={{ pl: 2 }}>
                <Typography component="li" variant="body1">
                  To check the status and action taken.
                </Typography>
                <Typography component="li" variant="body1">
                  To provide additional information.
                </Typography>
                <Typography component="li" variant="body1">
                  To respond to requests for information from system administrators.
                </Typography>
              </Stack>
            </Box>

            {/* Legal Links */}
            <Stack spacing={1}>
              <Typography variant="body1">
                You can read more about the whistleblowing legislation in EU{' '}
                <Button variant="text" sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}>
                  here
                </Button>
                .
              </Typography>
              <Typography variant="body1">
                <Button variant="text" sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}>
                  Here
                </Button>{' '}
                you can read about what you should know before submitting a report.
              </Typography>
            </Stack>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Iconify icon="mingcute:add-line" />}
                sx={{ minWidth: 200 }}
              >
                Create a new report
              </Button>
              <Button variant="outlined" size="large" sx={{ minWidth: 200 }}>
                Follow up on existing report
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          py: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Whistleblower Software is provided by Whistleblower Software ApS.
        </Typography>
      </Box>
    </Box>
    </>
  );
}
