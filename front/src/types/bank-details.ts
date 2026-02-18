export interface BankDetails {
  id: string;
  iban: string;
  bic: string;
  bankAccount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankDetailsFormValues {
  iban: string;
  bic: string;
  bankAccount: string;
}
