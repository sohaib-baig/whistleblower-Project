import type { IconifyJSON } from '@iconify/react';

import { addCollection } from '@iconify/react';

import allIcons from './icon-sets';

// ----------------------------------------------------------------------

// In some build/deploy environments, a bad import can yield `undefined` here.
// Guard to avoid runtime crashes when calling Object.entries on null/undefined.
const safeAllIcons: Record<string, any> = (allIcons as any) || {};

export const iconSets = Object.entries(safeAllIcons).reduce((acc, [key, value]) => {
  const [prefix, iconName] = key.split(':');
  const existingPrefix = acc.find((item) => item.prefix === prefix);

  if (existingPrefix) {
    existingPrefix.icons[iconName] = value;
  } else {
    acc.push({
      prefix,
      icons: {
        [iconName]: value,
      },
    });
  }

  return acc;
}, [] as IconifyJSON[]);

export const allIconNames = Object.keys(safeAllIcons) as IconifyName[];

export type IconifyName = keyof typeof safeAllIcons;

// ----------------------------------------------------------------------

let areIconsRegistered = false;

export function registerIcons() {
  if (areIconsRegistered) {
    return;
  }

  iconSets.forEach((iconSet) => {
    const iconSetConfig = {
      ...iconSet,
      width: (iconSet.prefix === 'carbon' && 32) || 24,
      height: (iconSet.prefix === 'carbon' && 32) || 24,
    };

    addCollection(iconSetConfig);
  });

  areIconsRegistered = true;
}
