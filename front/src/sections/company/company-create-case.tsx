import type { CompanyLanding, CompanyContent } from 'src/types/company-landing';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatPhoneNumber } from 'react-phone-number-input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { processAudioForAnonymity } from 'src/utils/audio-processor';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales/use-locales';
import {
  submitCase,
  getCategories,
  type Category,
  getCaseManagers,
  getCaseQuestions,
  getCompanyBySlug,
  type CaseManager,
  getCompanyContent,
  type CaseQuestion,
  uploadCaseAttachment,
} from 'src/actions/company-landing';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { CaseSubmissionDialog } from './case-submission-dialog';

// ----------------------------------------------------------------------

// CASE_HANDLERS will be fetched dynamically from API

// Categories will be fetched from API

// Form Schema - Base schema
// Note: Error messages will be translated in the component using t() function
// These are fallback messages in English
const createCaseFormSchema = (questions: CaseQuestion[], t?: (key: string) => string) => {
  const getTranslation = (key: string, fallback: string) => (t ? t(key) : fallback);

  const schemaObject: Record<string, z.ZodTypeAny> = {
    reportingMedium: z
      .string()
      .min(1, getTranslation('createCase.reportingMediumRequired', 'Reporting medium is required')),
    title: z.string().min(1, getTranslation('createCase.titleRequired', 'Title is required')),
    description: z
      .string()
      .min(1, getTranslation('createCase.descriptionRequired', 'Description is required')),
    reportType: z.enum(['report_annonymously', 'report_with_personal_details']),
    caseHandler: z.string().optional(),

    // Personal details (required if report_type is report_with_personal_details)
    personalName: z.string().optional(),
    personalEmail: z
      .string()
      .email(getTranslation('createCase.invalidEmail', 'Invalid email address'))
      .optional()
      .or(z.literal('')),
    personalPhone: z.string().optional(),
    personalAddress: z.string().optional(),

    // Categories
    categories: z
      .string()
      .min(1, getTranslation('createCase.categoryRequired', 'Category is required')),

    // Physical meeting
    meetingAddress: z.string().optional(),
  };

  // Add dynamic question fields
  questions.forEach((question) => {
    const fieldName = `question_${question.id}`;
    if (question.is_required) {
      schemaObject[fieldName] = z
        .string()
        .min(1, getTranslation('createCase.fieldRequired', `${question.name} is required`));
    } else {
      schemaObject[fieldName] = z.string().optional();
    }
  });

  return z.object(schemaObject);
};

export type CaseFormSchemaType = z.infer<ReturnType<typeof createCaseFormSchema>>;

// ----------------------------------------------------------------------

export function CompanyCreateCasePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslate('company');
  const { i18n } = useTranslation();
  const [company, setCompany] = useState<CompanyLanding | null>(null);
  const [pageContent, setPageContent] = useState<CompanyContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [caseId, setCaseId] = useState<string>('');
  const [questions, setQuestions] = useState<CaseQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);
  const [caseManagersLoading, setCaseManagersLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  // Use refs to track if case managers have been fetched (to avoid ESLint warnings)
  const caseManagersFetchedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create default values dynamically based on questions
  const createDefaultValues = (qs: CaseQuestion[]): Record<string, any> => {
    const defaults: Record<string, any> = {
      reportingMedium: '',
      title: '',
      description: '',
      reportType: 'report_annonymously',
      caseHandler: '',
      personalName: '',
      personalEmail: '',
      personalPhone: '',
      personalAddress: '',
      categories: '',
      meetingAddress: '',
    };

    // Add default values for all questions
    qs.forEach((question) => {
      defaults[`question_${question.id}`] = '';
    });

    return defaults;
  };

  const methods = useForm({
    resolver: zodResolver(createCaseFormSchema(questions, t)),
    defaultValues: createDefaultValues(questions),
  });

  const {
    watch,
    handleSubmit,
    formState: { isSubmitting: formIsSubmitting },
  } = methods;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportingMedium = watch('reportingMedium');
  const reportType = watch('reportType');

  useEffect(() => {
    const fetchCompany = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const [companyData, contentData] = await Promise.all([
          getCompanyBySlug(slug),
          getCompanyContent(slug, 'create-case'),
        ]);
        setCompany(companyData);
        setPageContent(contentData);

        // Fetch questions and case managers using company ID from URL (slug is the company ID)
        const companyId = slug;

        // Fetch questions (will be translated based on Accept-Language header)
        // Questions are refetched when language changes to get translations
        setQuestionsLoading(true);
        try {
          const fetchedQuestions = await getCaseQuestions(companyId);
          setQuestions(fetchedQuestions);

          // Reset form with new schema when questions are loaded
          const newDefaultValues = createDefaultValues(fetchedQuestions);
          methods.reset(newDefaultValues);
        } catch (questionError) {
          console.error('Error fetching questions:', questionError);
        } finally {
          setQuestionsLoading(false);
        }

        // Fetch case managers (only once, not language-dependent)
        if (!caseManagersFetchedRef.current) {
          setCaseManagersLoading(true);
          try {
            const fetchedCaseManagers = await getCaseManagers(companyId);
            setCaseManagers(fetchedCaseManagers);
            caseManagersFetchedRef.current = true;
          } catch (caseManagerError) {
            console.error('Error fetching case managers:', caseManagerError);
          } finally {
            setCaseManagersLoading(false);
          }
        }

        // Fetch categories (will be translated based on Accept-Language header)
        // Categories are refetched when language changes to get translations
        setCategoriesLoading(true);
        try {
          const fetchedCategories = await getCategories();
          setCategories(fetchedCategories);
        } catch (categoryError) {
          console.error('Error fetching categories:', categoryError);
        } finally {
          setCategoriesLoading(false);
        }
      } catch (fetchError) {
        console.error('Error fetching company:', fetchError);
        setError('Company not found');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [slug, i18n.language, methods]);

  // Generate a random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789^!@#$%&*';
    let password = '';
    for (let i = 0; i < 20; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!slug) {
        throw new Error('Company ID is missing');
      }

      // Collect all question answers
      const answers: Array<{ question_id: string; answer: string }> = [];
      questions.forEach((question) => {
        const fieldName = `question_${question.id}` as keyof typeof data;
        const answerValue = data[fieldName];
        if (answerValue !== undefined && answerValue !== null && answerValue !== '') {
          answers.push({
            question_id: question.id,
            answer: String(answerValue),
          });
        }
      });

      // Prepare personal details if report type is with personal details
      const personalDetails: Record<string, any> | null =
        data.reportType === 'report_with_personal_details'
          ? {
              name: data.personalName || '',
              email: data.personalEmail || '',
              phone: data.personalPhone || '',
              address: data.personalAddress || '',
            }
          : null;

      // Generate password
      const password = generatePassword();

      // Map reporting medium from frontend to backend format
      const reportingMediumMap: Record<string, string> = {
        written: 'written', // Combined written + oral functionality
        phone: 'phone_call',
        physical: 'physical_meeting',
      };

      const reportingMediumValue = String(data.reportingMedium || '');

      // Prepare case data for API
      const caseData: Record<string, any> = {
        company_id: slug,
        reporting_medium: reportingMediumMap[reportingMediumValue] || reportingMediumValue,
        title: data.title || null,
        description: data.description || null,
        report_type: data.reportType,
        personal_details: personalDetails,
        case_category_id: data.categories,
        case_manager_id: data.caseHandler || null,
        email:
          data.reportType === 'report_with_personal_details' ? data.personalEmail || null : null,
        password,
        meeting_address: data.reportingMedium === 'physical' ? company?.contactInfo?.physicalAddress || null : null,
        answers,
      };

      const response = await submitCase(caseData);

      const newCaseId = response.case_id || '';

      // Set generated password and case ID from response
      setGeneratedPassword(response.password || password);
      setCaseId(newCaseId);

      // Prepare audio file if available and reporting medium is written (combined written + oral)
      const audioFile =
        audioBlob && data.reportingMedium === 'written'
          ? new File([audioBlob], 'audio-recording.webm', {
              type: audioBlob.type || 'audio/webm',
            })
          : undefined;

      // Upload audio file and other file attachments after case creation
      const filesToUpload: File[] = [];
      
      // Add audio file if available
      if (audioFile) {
        filesToUpload.push(audioFile);
      }
      
      // Add other selected files
      filesToUpload.push(...selectedFiles);

      if (filesToUpload.length > 0 && newCaseId) {
        try {
          await Promise.all(
            filesToUpload.map((file) => uploadCaseAttachment(newCaseId, file, file.name))
          );
          setSelectedFiles([]);
          // Clear audio blob after successful submission
          if (audioBlob) {
            setAudioBlob(null);
          }
        } catch (attachmentError: any) {
          console.error('Failed to upload attachments:', attachmentError);
          const attachmentErrorMessage =
            attachmentError?.response?.data?.message ||
            attachmentError?.message ||
            'Failed to upload attachments. Please try again.';
          setError(attachmentErrorMessage);
        }
      } else {
        // Clear audio blob even if no files to upload
        if (audioBlob) {
          setAudioBlob(null);
        }
      }

      setDialogOpen(true);
    } catch (submitError: any) {
      console.error('Error submitting case:', submitError);
      const errorMessage = submitError?.message || 'Failed to submit case. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  });

  const renderCompanyName = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {t('createCase.company')}: {company?.name || t('layout.loading')}
      </Typography>
      <Divider />
    </Box>
  );

  const renderContactInfo = () => {
    const formatTime = (timeStr: string | null | undefined, shouldConvert: boolean = false): string => {
      if (!timeStr) return '-';
      
      // If in HH:mm or HH:mm:ss format
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
        const timeOnly = timeStr.substring(0, 5);
        
        // Convert to 12h format if phone call is selected and format is 12h
        if (shouldConvert && company?.contactInfo?.phoneHoursFormat === '12h') {
          try {
            // Parse the time (HH:mm format)
            const [hours, minutes] = timeOnly.split(':').map(Number);
            const hour24 = hours;
            
            // Convert to 12-hour format
            let hour12 = hour24 % 12;
            if (hour12 === 0) hour12 = 12;
            const ampm = hour24 >= 12 ? 'PM' : 'AM';
            
            return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
          } catch {
            // If conversion fails, return original time
            return timeOnly;
          }
        }
        
        // Return 24-hour format (original)
        return timeOnly;
      }
      return timeStr;
    };

    // Only convert when phone call is selected
    const shouldConvert = reportingMedium === 'phone';
    
    // Format phone number for display
    const formatPhoneNumberDisplay = (phone: string | null | undefined): string => {
      if (!phone) return '-';
      try {
        // Try to format using react-phone-number-input
        const formatted = formatPhoneNumber(phone);
        return formatted || phone;
      } catch {
        // If formatting fails, return original phone number
        return phone;
      }
    };
    
    const phoneNumber = formatPhoneNumberDisplay(company?.contactInfo?.phone);
    const phoneHoursFrom = formatTime(company?.contactInfo?.phoneHoursFrom, shouldConvert);
    const phoneHoursTo = formatTime(company?.contactInfo?.phoneHoursTo, shouldConvert);
    const phoneHours = phoneHoursFrom !== '-' && phoneHoursTo !== '-' 
      ? `${phoneHoursFrom} - ${phoneHoursTo}`
      : '-';

    return (
      <Card sx={{ p: 3, mb: 3, bgcolor: 'background.neutral' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('createCase.contactInformation')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>{t('createCase.call')}:</strong> {phoneNumber}
        </Typography>
        <Typography variant="body1">
          <strong>{t('createCase.phoneHours')}:</strong> {phoneHours}
        </Typography>
      </Card>
    );
  };

  const renderPersonalDetails = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('createCase.personalDetails')}
      </Typography>
      <Box
        sx={{
          gap: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 2, md: 3 },
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Field.Text
            name="personalName"
            label={`${t('createCase.name')} *`}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Field.Text
            name="personalEmail"
            label={`${t('createCase.email')} *`}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 2, md: 3 },
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Field.Text
            name="personalPhone"
            label={`${t('createCase.phone')} *`}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Field.Text
            name="personalAddress"
            label={`${t('createCase.address')} *`}
            multiline
            rows={3}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      </Box>
    </Box>
  );

  const renderWrittenForm = () => (
    <Box
      sx={{
        gap: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Field.Text
        name="title"
        label={`${t('createCase.titleLabel')} *`}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Field.Text
        name="description"
        label={`${t('createCase.description')} *`}
        multiline
        rows={4}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Field.RadioGroup
        name="reportType"
        label={`${t('createCase.reportType')} *`}
        options={[
          { value: 'report_annonymously', label: t('createCase.reportAnonymously') },
          {
            value: 'report_with_personal_details',
            label: t('createCase.reportWithPersonalDetails'),
          },
        ]}
      />

      {reportType === 'report_with_personal_details' && renderPersonalDetails()}

      <Field.Select
        name="categories"
        label={`${t('createCase.selectCategories')} *`}
        slotProps={{ inputLabel: { shrink: true } }}
        disabled={categoriesLoading}
      >
        <MenuItem value="">
          {categoriesLoading
            ? t('createCase.loadingCategories')
            : t('createCase.selectCategoriesPlaceholder')}
        </MenuItem>
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.name}
          </MenuItem>
        ))}
        {!categoriesLoading && categories.length === 0 && (
          <MenuItem value="" disabled>
            {t('createCase.noCategoriesAvailable')}
          </MenuItem>
        )}
      </Field.Select>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('createCase.files')}
        </Typography>
        <Paper
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            const files = Array.from(event.dataTransfer.files || []);
            if (files.length) {
              setSelectedFiles((prev) => [...prev, ...files]);
            }
          }}
          sx={{
            p: 3,
            border: '1px dashed',
            // borderColor: 'divider',
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
            },
          }}
        >
          <Iconify
            icon="solar:add-folder-bold"
            sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {t('createCase.dragDropFiles')}
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              if (files.length) {
                setSelectedFiles((prev) => [...prev, ...files]);
              }
              event.target.value = '';
            }}
          />
        </Paper>
        {selectedFiles.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedFiles.map((file, index) => (
              <Chip
                key={`${file.name}-${index}`}
                label={file.name}
                onDelete={() =>
                  setSelectedFiles((prev) => prev.filter((_, chipIndex) => chipIndex !== index))
                }
              />
            ))}
          </Box>
        )}
      </Box>

      <Field.Select
        name="caseHandler"
        label={`${t('createCase.caseHandler')} *`}
        slotProps={{ inputLabel: { shrink: true } }}
        disabled={caseManagersLoading}
      >
        <MenuItem value="">
          {caseManagersLoading
            ? t('createCase.loadingCaseManagers')
            : t('createCase.selectCaseHandler')}
        </MenuItem>
        {caseManagers.map((caseManager) => (
          <MenuItem key={caseManager.id} value={caseManager.id}>
            {caseManager.name}
          </MenuItem>
        ))}
        {!caseManagersLoading && caseManagers.length === 0 && (
          <MenuItem value="" disabled>
            {t('createCase.noCaseManagersAvailable')}
          </MenuItem>
        )}
      </Field.Select>

      {/* Dynamic Questions */}
      {questionsLoading ? (
        <LinearProgress />
      ) : (
        questions.map((question) => {
          const fieldName = `question_${question.id}`;
          const label = question.is_required ? `${question.name} *` : question.name;

          switch (question.input_type) {
            case 'select':
              return (
                <Field.Select
                  key={question.id}
                  name={fieldName}
                  label={label}
                  required={question.is_required}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                      sx: question.is_required
                        ? {
                            '& .MuiFormLabel-asterisk': { color: 'error.main' },
                          }
                        : {},
                    },
                  }}
                >
                  <MenuItem value="">{t('createCase.selectOption')}</MenuItem>
                  {Array.isArray(question.options) && question.options.length > 0
                    ? question.options.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))
                    : null}
                </Field.Select>
              );

            case 'radio':
              return (
                <Box key={question.id}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    {label}
                    {question.is_required && (
                      <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                        *
                      </Box>
                    )}
                  </Typography>
                  <Field.RadioGroup
                    name={fieldName}
                    label=""
                    options={
                      Array.isArray(question.options) && question.options.length > 0
                        ? question.options.map((option) => ({
                            value: option,
                            label: option,
                          }))
                        : []
                    }
                  />
                </Box>
              );

            case 'checkbox':
              return <Field.Switch key={question.id} name={fieldName} label={label} />;

            case 'textarea':
              return (
                <Field.Text
                  key={question.id}
                  name={fieldName}
                  label={label}
                  required={question.is_required}
                  multiline
                  rows={4}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                      sx: question.is_required
                        ? {
                            '& .MuiFormLabel-asterisk': { color: 'error.main' },
                          }
                        : {},
                    },
                  }}
                />
              );

            case 'number':
              return (
                <Field.Text
                  key={question.id}
                  name={fieldName}
                  label={label}
                  required={question.is_required}
                  type="number"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                      sx: question.is_required
                        ? {
                            '& .MuiFormLabel-asterisk': { color: 'error.main' },
                          }
                        : {},
                    },
                  }}
                />
              );

            case 'date':
              return (
                <Field.Text
                  key={question.id}
                  name={fieldName}
                  label={label}
                  required={question.is_required}
                  type="date"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                      sx: question.is_required
                        ? {
                            '& .MuiFormLabel-asterisk': { color: 'error.main' },
                          }
                        : {},
                    },
                  }}
                />
              );

            case 'email':
              return (
                <Field.Text
                  key={question.id}
                  name={fieldName}
                  label={label}
                  required={question.is_required}
                  type="email"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                      sx: question.is_required
                        ? {
                            '& .MuiFormLabel-asterisk': { color: 'error.main' },
                          }
                        : {},
                    },
                  }}
                />
              );

            case 'tel':
              return (
                <Field.Text
                  key={question.id}
                  name={fieldName}
                  label={label}
                  required={question.is_required}
                  type="tel"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                      sx: question.is_required
                        ? {
                            '& .MuiFormLabel-asterisk': { color: 'error.main' },
                          }
                        : {},
                    },
                  }}
                />
              );

            case 'text':
            default:
              return (
                <Field.Text
                  key={question.id}
                  name={fieldName}
                  label={label}
                  required={question.is_required}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                      sx: question.is_required
                        ? {
                            '& .MuiFormLabel-asterisk': { color: 'error.main' },
                          }
                        : {},
                    },
                  }}
                />
              );
          }
        })
      )}
    </Box>
  );

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const options: MediaRecorderOptions = {};
      const supportedTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav',
      ];

      for (const mimeType of supportedTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          options.mimeType = mimeType;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        setError('Recording error occurred. Please try again.');
      };

      mediaRecorder.onstop = async () => {
        let mimeType = mediaRecorder.mimeType || 'audio/webm';
        if (mimeType.includes(';')) {
          mimeType = mimeType.split(';')[0];
        }
        if (!mimeType.startsWith('audio/')) {
          mimeType = 'audio/webm';
        }

        if (audioChunksRef.current.length === 0) {
          console.error('No audio chunks recorded');
          stream.getTracks().forEach((track) => track.stop());
          setError('No audio data recorded. Please try again.');
          return;
        }

        const originalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());

        // Process audio to alter voice for anonymity
        try {
          setIsProcessingAudio(true);
          const processedBlob = await processAudioForAnonymity(originalBlob);
          setAudioBlob(processedBlob);
        } catch (processingError) {
          console.error('Error processing audio:', processingError);
          // If processing fails, use original blob
          setAudioBlob(originalBlob);
        } finally {
          setIsProcessingAudio(false);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch (err: any) {
        console.error('Error stopping recording:', err);
        setError('Failed to stop recording. Please try again.');
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
    return cleanup;
  }, []);

  const renderOralForm = () => (
    <Box
      sx={{
        gap: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {renderWrittenForm()}

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          {t('createCase.audioRecording')}
        </Typography>
        
        {!isRecording && !audioBlob && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Iconify icon="solar:microphone-bold" />}
            onClick={startRecording}
            sx={{ mb: 2 }}
          >
            {t('createCase.startRecording') || 'Start Recording'}
          </Button>
        )}

        {isRecording && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:stop-bold" />}
              onClick={stopRecording}
            >
              {t('createCase.stopRecording') || 'Stop Recording'}
            </Button>
            <Typography variant="body2" color="error.main">
              {formatTime(recordingTime)}
            </Typography>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: 'error.main',
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': {
                    opacity: 1,
                  },
                  '50%': {
                    opacity: 0.5,
                  },
                },
              }}
            />
          </Box>
        )}

        {isProcessingAudio && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <LinearProgress sx={{ flex: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {t('createCase.processingAudio') || 'Processing audio...'}
            </Typography>
          </Box>
        )}

        {audioBlob && !isRecording && !isProcessingAudio && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body2" color="success.main">
              {t('createCase.audioRecorded') || 'Audio recorded successfully'}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setAudioBlob(null);
                setRecordingTime(0);
              }}
            >
              {t('createCase.recordAgain') || 'Record Again'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );

  const renderPhysicalMeetingForm = () => {
    const physicalAddress = company?.contactInfo?.physicalAddress || '-';
    
    return (
      <Card sx={{ p: 3, mb: 3, bgcolor: 'background.neutral' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('createCase.contactInformation')}
        </Typography>
        <Typography variant="body1">
          <strong>{t('createCase.address')}:</strong> {physicalAddress}
        </Typography>
      </Card>
    );
  };

  const renderFormContent = () => {
    switch (reportingMedium) {
      case 'written':
        return renderOralForm(); // Combined written + oral functionality
      case 'phone':
        return renderContactInfo();
      case 'physical':
        return renderPhysicalMeetingForm();
      default:
        return null;
    }
  };

  const renderForm = () => (
    <Box
      sx={{
        gap: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Field.Select
        name="reportingMedium"
        label={`${t('createCase.reportingMedium')} *`}
        slotProps={{ inputLabel: { shrink: true } }}
      >
        <MenuItem value="">{t('createCase.selectReportingMedium')}</MenuItem>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <MenuItem value="written">{t('createCase.written')}</MenuItem>
        <MenuItem value="phone">{t('createCase.phoneCall')}</MenuItem>
        <MenuItem value="physical">{t('createCase.physicalMeeting')}</MenuItem>
      </Field.Select>

      {renderFormContent()}

      {reportingMedium && reportingMedium !== 'phone' && reportingMedium !== 'physical' && (
        <Button
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          disabled={isSubmitting || formIsSubmitting}
          sx={{ mt: 3 }}
        >
          {isSubmitting || formIsSubmitting
            ? t('createCase.submittingCase')
            : t('createCase.submitCase')}
        </Button>
      )}

      {(reportingMedium === 'phone' || reportingMedium === 'physical') && (
        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={() => {
            if (slug) {
              navigate(`/company/${slug}`);
            }
          }}
          sx={{ mt: 3 }}
        >
          {t('createCase.backToCase') || 'Back to Case'}
        </Button>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const pageTitle = company?.name || 'Create Case';

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} - ${CONFIG.appName}`}</title>
      </Helmet>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 }, px: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        {/* Title: Use translation key */}
        <Typography
          variant="h3"
          sx={{ mb: 2, fontSize: { xs: '1.5rem', md: '2.125rem' }, textAlign: 'left' }}
        >
          {t('createCase.title')}
        </Typography>

        {/* Subtitle: Always use translation key */}
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'left', mb: 2 }}>
          {t('createCase.subtitle')}
        </Typography>

        {/* Additional Dynamic Content from API (only if it contains more than just the subtitle) */}
        {(() => {
          const apiContent = pageContent?.content?.trim();
          if (!apiContent) return null;

          // Strip HTML tags to compare text content
          const textContent = apiContent.replace(/<[^>]*>/g, '').trim();
          const subtitle = t('createCase.subtitle');

          // Only show API content if it's significantly different (has more content or different structure)
          // Check if it's more than just the subtitle wrapped in HTML
          const isJustSubtitle =
            textContent === subtitle ||
            textContent === `<p>${subtitle}</p>`.replace(/<[^>]*>/g, '') ||
            (textContent.length <= subtitle.length + 50 && textContent.includes(subtitle));

          if (isJustSubtitle) {
            return null; // Don't show duplicate content
          }

          // Show API content if it has additional content
          return (
            <Box
              sx={{
                textAlign: 'left',
                mt: 2,
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  color: 'text.primary',
                  fontWeight: 600,
                  mb: 2,
                  mt: 3,
                  '&:first-of-type': { mt: 0 },
                },
                '& p': {
                  color: 'text.secondary',
                  lineHeight: 1.7,
                  mb: 2,
                },
                '& ul, & ol': {
                  pl: 3,
                  mb: 2,
                  '& li': {
                    color: 'text.secondary',
                    lineHeight: 1.7,
                    mb: 0.5,
                  },
                },
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                },
              }}
              dangerouslySetInnerHTML={{ __html: apiContent }}
            />
          );
        })()}
      </Box>

      <Paper sx={{ p: { xs: 2, md: 4 } }}>
        {renderCompanyName()}

        <Form methods={methods} onSubmit={onSubmit}>
          {renderForm()}
        </Form>
      </Paper>

      <CaseSubmissionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        password={generatedPassword}
        caseId={caseId}
        companySlug={slug || ''}
      />
    </Container>
    </>
  );
}
