import type {
  BasicConfiguration,
  BasicConfigurationFormValues,
} from 'src/types/basic-configuration';

import { endpoints } from 'src/lib/axios';
import { CONFIG } from 'src/global-config';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export async function getBasicConfiguration(): Promise<BasicConfiguration | null> {
  try {
    const res = await sanctum.get(endpoints.basicConfiguration.get);
    const data: any = res.data || {};
    const logo: string | undefined = (() => {
      const value = data.logo as string | undefined;
      if (!value) return undefined;
      // If backend returns a relative path like /storage/..., prefix serverUrl
      if (value.startsWith('/')) return `${CONFIG.serverUrl}${value}`;
      return value;
    })();
    const smallLogo: string | undefined = (() => {
      const value = data.small_logo as string | undefined;
      if (!value) return undefined;
      // If backend returns a relative path like /storage/..., prefix serverUrl
      if (value.startsWith('/')) return `${CONFIG.serverUrl}${value}`;
      return value;
    })();

    return {
      id: 'admin-settings',
      logo,
      smallLogo,
      defaultOpenStateDeadline: Number(data.open_state_deadline_days || 0),
      defaultClosedStateDeadline: Number(data.close_state_deadline_days || 0),
      invoiceNote: data.invoice_note || '',
      vat: Number(data.vat || 0),
      price: Number(data.price || 0),
      phoneHoursFrom: data.phone_hours_from || '09:00',
      phoneHoursTo: data.phone_hours_to || '18:00',
      deleteClosedCases: Boolean(data.delete_closed_cases || false),
      deleteClosedCasesPeriod: data.delete_closed_cases_period ? Number(data.delete_closed_cases_period) : null,
      deleteClosedCasesPeriodType: data.delete_closed_cases_period_type || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error loading basic configuration:', error);
    return null;
  }
}

export async function saveBasicConfiguration(
  data: BasicConfigurationFormValues
): Promise<BasicConfiguration> {
  try {
    await initSanctumCsrf();

    let logoData: string | null = null;
    if (data.logo) {
      logoData = await convertFileToBase64(data.logo);
    }

    let smallLogoData: string | null = null;
    if (data.smallLogo) {
      smallLogoData = await convertFileToBase64(data.smallLogo);
    }

    await sanctum.put(endpoints.basicConfiguration.update, {
      logo: logoData,
      small_logo: smallLogoData,
      open_state_deadline_days: data.defaultOpenStateDeadline,
      close_state_deadline_days: data.defaultClosedStateDeadline,
      vat: data.vat,
      price: data.price,
      phone_hours_from: data.phoneHoursFrom,
      phone_hours_to: data.phoneHoursTo,
      invoice_note: data.invoiceNote || '',
      delete_closed_cases: data.deleteClosedCases,
      delete_closed_cases_period: data.deleteClosedCases ? (data.deleteClosedCasesPeriod || null) : null,
      delete_closed_cases_period_type: data.deleteClosedCases ? (data.deleteClosedCasesPeriodType || null) : null,
    });

    return {
      id: 'admin-settings',
      logo: logoData || undefined,
      smallLogo: smallLogoData || undefined,
      defaultOpenStateDeadline: data.defaultOpenStateDeadline,
      defaultClosedStateDeadline: data.defaultClosedStateDeadline,
      invoiceNote: data.invoiceNote || '',
      vat: data.vat,
      price: data.price,
      phoneHoursFrom: data.phoneHoursFrom,
      phoneHoursTo: data.phoneHoursTo,
      deleteClosedCases: data.deleteClosedCases,
      deleteClosedCasesPeriod: data.deleteClosedCasesPeriod || null,
      deleteClosedCasesPeriodType: data.deleteClosedCasesPeriodType || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error saving basic configuration:', error);
    throw new Error('Failed to save basic configuration');
  }
}

export async function resetToDefaults(): Promise<BasicConfiguration> {
  try {
    // Optionally, could call backend to reset. For now, use hard defaults and save.
    const defaults: BasicConfigurationFormValues = {
      defaultOpenStateDeadline: 30,
      defaultClosedStateDeadline: 90,
      invoiceNote: '',
      vat: 0,
      price: 0,
      phoneHoursFrom: '09:00',
      phoneHoursTo: '17:00',
      deleteClosedCases: false,
    };
    return await saveBasicConfiguration(defaults);
  } catch (error) {
    console.error('Error resetting to defaults:', error);
    throw new Error('Failed to reset to defaults');
  }
}

async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
