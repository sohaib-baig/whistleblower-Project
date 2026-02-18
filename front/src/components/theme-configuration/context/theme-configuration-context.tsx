import type { ThemeConfigurationContextValue } from 'src/types/theme-configuration';

import { createContext } from 'react';

export const ThemeConfigurationContext = createContext<ThemeConfigurationContextValue | null>(null);
