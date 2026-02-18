export interface StripeConfiguration {
  id: string;
  clientId: string;
  secretKey: string;
  productKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StripeConfigurationFormValues {
  clientId: string;
  secretKey: string;
  productKey: string;
}
