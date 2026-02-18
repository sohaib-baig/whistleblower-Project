export type QuestionInputType =
  | 'text'
  | 'select'
  | 'password'
  | 'email'
  | 'url'
  | 'tel'
  | 'search'
  | 'number'
  | 'range'
  | 'date'
  | 'datetime-local'
  | 'month'
  | 'week'
  | 'time'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'color';

export type IQuestion = {
  id: string;
  name: string;
  isRequired: boolean;
  inputType: QuestionInputType;
  options?: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type IQuestionFormData = {
  name: string;
  isRequired: boolean;
  inputType: QuestionInputType;
  options?: string[];
};

export type IQuestionTableFilters = {
  name: string;
  inputType: string;
};

export type QuestionFilterType = 'all' | QuestionInputType;

export const QUESTION_INPUT_TYPES: { value: QuestionInputType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'select', label: 'Select' },
  { value: 'password', label: 'Password' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'tel', label: 'Telephone' },
  { value: 'search', label: 'Search' },
  { value: 'number', label: 'Number' },
  { value: 'range', label: 'Range' },
  { value: 'date', label: 'Date' },
  { value: 'datetime-local', label: 'Date Time Local' },
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'time', label: 'Time' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'file', label: 'File' },
  { value: 'color', label: 'Color' },
];
