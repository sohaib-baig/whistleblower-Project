import { Container } from '@mui/material';

import { ThemeConfigurationSection } from 'src/components/theme-configuration';

export function ThemeConfigurationView() {
  return (
    <Container maxWidth="xl">
      <ThemeConfigurationSection />
    </Container>
  );
}
