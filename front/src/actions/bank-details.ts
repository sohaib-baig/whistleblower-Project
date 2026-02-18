import type { BankDetails, BankDetailsFormValues } from 'src/types/bank-details';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export async function getBankDetails(): Promise<BankDetails | null> {
  try {
    const res = await sanctum.get(endpoints.bankDetails.get);
    const data: any = res.data || {};
    return {
      id: 'admin-settings',
      iban: data.iban || '',
      bic: data.bic_code || '',
      bankAccount: data.bank_account || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error loading bank details:', error);
    return null;
  }
}

export async function saveBankDetails(data: BankDetailsFormValues): Promise<BankDetails> {
  try {
    await initSanctumCsrf();
    await sanctum.put(endpoints.bankDetails.update, {
      iban: data.iban,
      bic_code: data.bic,
      bank_account: data.bankAccount,
    });

    return {
      id: 'admin-settings',
      ...data,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error saving bank details:', error);
    throw new Error('Failed to save bank details');
  }
}

export async function clearBankDetails(): Promise<void> {
  // No-op now that data is server-driven
}
