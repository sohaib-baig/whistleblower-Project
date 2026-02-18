import type { ICaseItem } from 'src/types/case';

import { useState } from 'react';

import { _cases } from 'src/_mock/_case';

// ----------------------------------------------------------------------

export function useGetCases() {
  const [casesLoading] = useState(false);

  const [cases] = useState<ICaseItem[]>(_cases);

  const casesEmpty = !cases.length;

  return {
    cases,
    casesLoading,
    casesEmpty,
  };
}
