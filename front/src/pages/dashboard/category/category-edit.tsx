import { useParams } from 'src/routes/hooks';

import { CategoryEditView } from 'src/sections/category/view';

export default function Page() {
  const { id } = useParams();

  return <CategoryEditView id={id || ''} />;
}
