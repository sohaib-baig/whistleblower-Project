export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  placeholder: string;
  language: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateFormValues {
  name: string;
  subject: string;
  content: string;
  placeholder?: string;
  language: string;
  status: string;
}
