import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export async function deleteRole(roleId: string) {
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In a real application, you would make an API call here:
    // await axios.delete(`/api/roles/${roleId}`);

    toast.success('Role deleted successfully!');

    return { success: true };
  } catch (error) {
    console.error('Error deleting role:', error);
    toast.error('Failed to delete role');
    throw error;
  }
}
