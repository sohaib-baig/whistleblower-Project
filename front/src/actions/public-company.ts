import axios from 'src/lib/axios';

export interface PublicCompany {
  id: string;
  name: string;
  logo?: string;
}

export async function fetchPublicCompany(companyId: string): Promise<PublicCompany | null> {
  try {
    const res = await axios.get(`/api/v1/public/companies/${companyId}`);
    const data: any = (res as any)?.data || {};
    const company = data?.data ?? data; // handle envelope or raw
    if (!company) return null;
    return {
      id: company.id,
      name: company.name || company.company_name || 'Company',
      logo: company.logo_url || undefined,
    };
  } catch (error) {
    console.error('Failed to load company details:', error);
    return null;
  }
}
