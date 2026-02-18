import { z as zod } from 'zod';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { createQuestion, updateQuestion } from 'src/actions/question';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { RHFSelect, RHFTextField } from 'src/components/hook-form';

import { type IQuestion, QUESTION_INPUT_TYPES, type IQuestionFormData } from 'src/types/question';

// ----------------------------------------------------------------------

type QuestionFormValues = {
  name: string;
  isRequired: boolean;
  inputType: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: IQuestionFormData) => void;
  question?: IQuestion | null;
};

export default function QuestionNewEditForm({ open, onClose, onSave, question }: Props) {
  const { t } = useTranslate('navbar');

  const QuestionSchema = zod.object({
    name: zod.string().min(1, t('dashboard.question.nameRequired')),
    isRequired: zod.boolean(),
    inputType: zod.string().min(1, t('dashboard.question.inputTypeRequired')),
  });
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  const defaultValues = useMemo(
    () => ({
      name: question?.name || '',
      isRequired: question?.isRequired || false,
      inputType: question?.inputType || 'text',
    }),
    [question]
  );

  const methods = useForm<QuestionFormValues>({
    resolver: zodResolver(QuestionSchema),
    defaultValues,
  });

  const { handleSubmit, watch, reset, setValue } = methods;
  const watchedInputType = watch('inputType');

  useEffect(() => {
    if (question) {
      reset({
        name: question.name,
        isRequired: question.isRequired,
        inputType: question.inputType,
      });
      setOptions(question.options || []);
    } else {
      reset(defaultValues);
      setOptions([]);
    }
  }, [question, reset, defaultValues]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const formData: IQuestionFormData = {
        name: data.name,
        isRequired: data.isRequired,
        inputType: data.inputType as any,
        options: options.length > 0 ? options : undefined,
      };

      if (question) {
        // Update existing question
        await updateQuestion(question.id, formData);
        toast.success(t('dashboard.question.questionUpdated'));
      } else {
        // Create new question
        await createQuestion(formData);
        toast.success(t('dashboard.question.questionCreated'));
      }

      onSave(formData);
      handleClose();
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(t('dashboard.question.failedToSave'));
    }
  });

  const handleClose = () => {
    reset();
    setOptions([]);
    setNewOption('');
    onClose();
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setOptions((prev) => [...prev, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInputTypeChange = (inputType: string) => {
    setValue('inputType', inputType);
    // Clear options when switching to non-option types
    if (!['select', 'checkbox', 'radio'].includes(inputType)) {
      setOptions([]);
    }
  };

  const needsOptions = ['select', 'checkbox', 'radio'].includes(watchedInputType);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' },
      }}
    >
      <DialogTitle>
        {question ? t('dashboard.question.editQuestion') : t('dashboard.question.newQuestion')}
      </DialogTitle>

      <FormProvider {...methods}>
        <Box component="form" onSubmit={onSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <RHFTextField
                name="name"
                label={t('dashboard.question.questionName')}
                placeholder={t('dashboard.question.questionNamePlaceholder')}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('dashboard.question.isRequired')}
                </Typography>
                <RadioGroup
                  row
                  value={watch('isRequired')}
                  onChange={(e) => setValue('isRequired', e.target.value === 'true')}
                >
                  <FormControlLabel value control={<Radio />} label={t('dashboard.question.yes')} />
                  <FormControlLabel
                    value={false}
                    control={<Radio />}
                    label={t('dashboard.question.no')}
                  />
                </RadioGroup>
              </Box>

              <RHFSelect
                name="inputType"
                label={t('dashboard.question.inputType')}
                placeholder={t('dashboard.question.inputTypePlaceholder')}
                onChange={(e) => handleInputTypeChange(e.target.value)}
              >
                {QUESTION_INPUT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {t(`dashboard.question.inputTypes.${type.value}` as any)}
                  </MenuItem>
                ))}
              </RHFSelect>

              {needsOptions && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    {t('dashboard.question.options')}
                  </Typography>

                  <Stack spacing={2}>
                    {options.map((option, index) => (
                      <Stack key={index} direction="row" spacing={2} alignItems="center">
                        <TextField
                          fullWidth
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...options];
                            newOptions[index] = e.target.value;
                            setOptions(newOptions);
                          }}
                          placeholder={`${t('dashboard.question.option')} ${index + 1}`}
                        />
                        <IconButton color="error" onClick={() => handleRemoveOption(index)}>
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>
                    ))}

                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder={t('dashboard.question.addNewOption')}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOption();
                          }
                        }}
                        sx={{ flex: '0 1 auto', maxWidth: '60%' }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddOption}
                        disabled={!newOption.trim()}
                        sx={{
                          whiteSpace: 'nowrap',
                          paddingX: 3,
                          paddingY: 1.5,
                          flex: '0 0 auto',
                          minWidth: '140px',
                        }}
                      >
                        {t('dashboard.question.addOption')}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              )}

              {watchedInputType === 'text' && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    borderRadius: 1,
                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <Typography variant="caption" color="primary">
                    <strong>{t('dashboard.question.preview.preview')}</strong>{' '}
                    {t('dashboard.question.preview.textInput', { name: watch('name') })}
                  </Typography>
                </Box>
              )}

              {[
                'password',
                'email',
                'url',
                'tel',
                'search',
                'number',
                'range',
                'date',
                'datetime-local',
                'month',
                'week',
                'time',
                'file',
                'color',
              ].includes(watchedInputType) && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    borderRadius: 1,
                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <Typography variant="caption" color="primary">
                    <strong>{t('dashboard.question.preview.preview')}</strong>{' '}
                    {t('dashboard.question.preview.input', {
                      name: watch('name'),
                      type: watchedInputType,
                    })}
                  </Typography>
                </Box>
              )}

              {needsOptions && options.length > 0 && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                    borderRadius: 1,
                    border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  }}
                >
                  <Typography variant="caption" color="success.main">
                    <strong>{t('dashboard.question.preview.preview')}</strong>{' '}
                    {t('dashboard.question.preview.inputWithOptions', {
                      type: t(`dashboard.question.inputTypes.${watchedInputType}` as any),
                      count: options.length,
                      options: options.join(', '),
                    })}
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button variant="outlined" onClick={handleClose}>
              {t('dashboard.question.cancel')}
            </Button>
            <Button type="submit" variant="contained">
              {question
                ? t('dashboard.question.updateQuestion')
                : t('dashboard.question.createQuestion')}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  );
}
