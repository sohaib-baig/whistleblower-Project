import type { UseFormReturn } from 'react-hook-form';

import { FormProvider as RHFForm } from 'react-hook-form';

// ----------------------------------------------------------------------

export type FormProps = {
  onSubmit?: (e?: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  methods: UseFormReturn<any>;
};

export function Form({ children, onSubmit, methods }: FormProps) {
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSubmit) {
      onSubmit(e);
    }
  };
  
  return (
    <RHFForm {...methods}>
      <form onSubmit={handleFormSubmit} noValidate autoComplete="off">
        {children}
      </form>
    </RHFForm>
  );
}
