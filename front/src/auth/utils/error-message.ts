// ----------------------------------------------------------------------

export function getErrorMessage(error: unknown): string {
  // Check if it's an axios error with response data
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as any;
    
    // Check for Laravel validation errors
    if (axiosError.response?.data) {
      const responseData = axiosError.response.data;
      
      // Laravel validation errors format: { message: "...", errors: { field: ["error"] } }
      if (responseData.message) {
        // If there are field-specific errors, include them
        if (responseData.errors && typeof responseData.errors === 'object') {
          const fieldErrors = Object.values(responseData.errors).flat();
          if (fieldErrors.length > 0) {
            return `${responseData.message}: ${fieldErrors.join(', ')}`;
          }
        }
        return responseData.message;
      }
      
      // Check for error property
      if (responseData.error) {
        return responseData.error;
      }
    }
    
    // Check for httpStatus and message
    if (axiosError.httpStatus && axiosError.message) {
      return axiosError.message;
    }
    
    // Check for message property
    const errorMessage = (error as { message?: string }).message;
    if (typeof errorMessage === 'string') {
      return errorMessage;
    }
  }

  if (error instanceof Error) {
    return error.message || error.name || 'An error occurred';
  }

  if (typeof error === 'string') {
    return error;
  }

  return `Unknown error: ${error}`;
}
