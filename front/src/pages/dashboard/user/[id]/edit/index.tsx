import { useParams } from 'react-router';

import { UserEditView } from 'src/sections/user/user-edit-view';

// ----------------------------------------------------------------------

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>User ID is required</div>;
  }

  return <UserEditView userId={id} />;
}
