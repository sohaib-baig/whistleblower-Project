import type { INewsItem } from 'src/types/news';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { _tags } from 'src/_mock';
import { useTranslate } from 'src/locales';
import { createNews, updateNews, uploadNewsCover } from 'src/actions/news';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { NewsDetailsPreview } from './news-details-preview';

// ----------------------------------------------------------------------

// Schema will be created inside component to access translations
const createNewsSchema = (t: any) =>
  z.object({
    title: z.string().min(1, { error: t('dashboard.news.errors.titleRequired') }),
    description: z.string().min(1, { error: t('dashboard.news.errors.descriptionRequired') }),
    content: schemaUtils.editor().min(20, { error: t('dashboard.news.errors.contentMinLength') }),
    coverUrl: schemaUtils.file().nullable().optional(),
    tags: z
      .string()
      .array()
      .optional(),
    metaKeywords: z
      .string()
      .array()
      .min(1, { error: t('dashboard.news.errors.metaKeywordsRequired') }),
    // Not required
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    status: z.string().optional(),
  });

// ----------------------------------------------------------------------

type Props = {
  currentNews?: INewsItem;
};

export function NewsCreateEditForm({ currentNews }: Props) {
  const { t } = useTranslate('navbar');
  const router = useRouter();

  const showPreview = useBoolean();
  const openDetails = useBoolean(true);
  const openProperties = useBoolean(true);

  const defaultValues: NewsCreateSchemaType = {
    title: '',
    description: '',
    content: '',
    coverUrl: null,
    tags: [],
    metaKeywords: [],
    metaTitle: '',
    metaDescription: '',
    status: 'draft',
  };

  const NewsCreateSchema = createNewsSchema(t);
  type NewsCreateSchemaType = z.infer<typeof NewsCreateSchema>;

  const methods = useForm<NewsCreateSchemaType>({
    mode: 'all',
    resolver: zodResolver(NewsCreateSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = methods;

  const values = watch();

  // Update form when currentNews data loads
  useEffect(() => {
    if (currentNews) {
      const formValues = {
        title: currentNews.title || '',
        description: currentNews.description || '',
        content: currentNews.content || '',
        coverUrl: currentNews.coverUrl || null,
        tags: currentNews.tags || [],
        metaKeywords: currentNews.metaKeywords || [],
        metaTitle: currentNews.metaTitle || '',
        metaDescription: currentNews.metaDescription || '',
        status: currentNews.publish || 'draft',
      };

      reset(formValues);
    }
  }, [currentNews, reset, methods]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      let newsId: string;

      // Check if cover image was deleted (was a URL string, now null)
      const hadCoverImage = currentNews?.coverUrl && typeof currentNews.coverUrl === 'string';
      const coverImageDeleted = hadCoverImage && !data.coverUrl;

      // Prepare the data
      const newsData: any = {
        title: data.title,
        content: data.content,
        status: data.status || 'draft',
        meta_title: data.metaTitle,
        meta_description: data.metaDescription,
        meta_keywords: data.metaKeywords.join(','),
      };

      // If cover image was deleted, send null to backend
      if (coverImageDeleted) {
        newsData.cover_image = null;
      }

      if (currentNews) {
        // Update existing news
        await updateNews(currentNews.id, newsData);
        newsId = currentNews.id;
        toast.success(t('dashboard.news.toast.updatedSuccessfully'));
      } else {
        // Create new news
        const createdNews = await createNews(newsData);
        newsId = createdNews.id;
        toast.success(t('dashboard.news.toast.createdSuccessfully'));
      }

      // Upload cover image if a new file was provided
      if (data.coverUrl && data.coverUrl instanceof File) {
        try {
          await uploadNewsCover(newsId, data.coverUrl);
          toast.success(t('dashboard.news.toast.coverUploadedSuccessfully'));
        } catch (error) {
          console.error('Failed to upload cover:', error);
          toast.warning(t('dashboard.news.toast.coverUploadFailed'));
        }
      }

      reset();
      showPreview.onFalse();
      router.push(paths.dashboard.news.list);
    } catch (error) {
      console.error('Failed to save news:', error);
      toast.error(t('dashboard.news.toast.saveFailed'));
    }
  });

  const renderCollapseButton = (value: boolean, onToggle: () => void) => (
    <IconButton onClick={onToggle}>
      <Iconify icon={value ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'} />
    </IconButton>
  );

  const renderDetails = () => (
    <Card>
      <CardHeader
        title={t('dashboard.news.details.heading')}
        subheader={t('dashboard.news.details.subheader')}
        action={renderCollapseButton(openDetails.value, openDetails.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openDetails.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Field.Text name="title" label={t('dashboard.news.details.newsTitle')} />

          <Field.Text
            name="description"
            label={t('dashboard.news.details.description')}
            multiline
            rows={3}
          />

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">{t('dashboard.news.details.content')}</Typography>
            <Field.Editor name="content" sx={{ maxHeight: 480 }} />
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">{t('dashboard.news.details.coverImage')}</Typography>
            <Field.Upload
              name="coverUrl"
              maxSize={5242880}
              helperText={t('dashboard.news.details.coverImageHelper')}
            />
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );

  const renderProperties = () => (
    <Card>
      <CardHeader
        title={t('dashboard.news.properties.heading')}
        subheader={t('dashboard.news.properties.subheader')}
        action={renderCollapseButton(openProperties.value, openProperties.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openProperties.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Field.Text name="metaTitle" label={t('dashboard.news.properties.metaTitle')} />

          <Field.Text
            name="metaDescription"
            label={t('dashboard.news.properties.metaDescription')}
            fullWidth
            multiline
            rows={3}
          />

          <Field.Autocomplete
            name="metaKeywords"
            label={t('dashboard.news.properties.metaKeywords')}
            placeholder={t('dashboard.news.properties.metaKeywordsPlaceholder')}
            multiple
            freeSolo
            disableCloseOnSelect
            options={_tags.map((option) => option)}
            getOptionLabel={(option) => option}
            slotProps={{
              chip: { color: 'info' },
            }}
          />
        </Stack>
      </Collapse>
    </Card>
  );

  const renderActions = () => (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <FormControlLabel
        label={t('dashboard.news.actions.publish')}
        control={
          <Switch
            checked={values.status === 'published'}
            onChange={(e) => setValue('status', e.target.checked ? 'published' : 'draft')}
            slotProps={{ input: { id: 'publish-switch' } }}
          />
        }
        sx={{ pl: 3, flexGrow: 1 }}
      />

      <div>
        <Button color="inherit" variant="outlined" size="large" onClick={showPreview.onTrue}>
          {t('dashboard.news.actions.preview')}
        </Button>

        <Button
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          sx={{ ml: 2 }}
        >
          {!currentNews
            ? t('dashboard.news.actions.createNews')
            : t('dashboard.news.actions.saveChanges')}
        </Button>
      </div>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={5} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails()}
        {renderProperties()}
        {renderActions()}
      </Stack>

      <NewsDetailsPreview
        isValid={isValid}
        onSubmit={onSubmit}
        title={values.title}
        open={showPreview.value}
        content={values.content}
        onClose={showPreview.onFalse}
        coverUrl={values.coverUrl}
        isSubmitting={isSubmitting}
        description={values.description}
      />
    </Form>
  );
}
