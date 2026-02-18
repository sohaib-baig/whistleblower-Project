import type { ISupportTicketForm } from 'src/types/support-ticket';
import type { CaseListItem } from 'src/actions/company-case-details';

import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetchActiveCases, createSupportTicket } from 'src/actions/support-ticket';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function SupportTicketCreateView() {
  const [loading, setLoading] = useState(false);
  const [activeCases, setActiveCases] = useState<CaseListItem[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const { user } = useAuthContext();
  const router = useRouter();

  const methods = useForm<ISupportTicketForm>({
    defaultValues: {
      title: '',
      content: '',
      status: 'open',
      support_type: 'technical_support',
      case_id: null,
    },
  });

  const { handleSubmit, watch, setValue } = methods;

  const statusValue = watch('status');
  const supportTypeValue = watch('support_type');

  // Fetch active cases when support type is legal_support
  useEffect(() => {
    const loadActiveCases = async () => {
      if (supportTypeValue === 'legal_support') {
        setLoadingCases(true);
        try {
          // Prefer explicit company id (for company users and case managers)
          const companyId = (user as any)?.company?.id ?? (user as any)?.company_id ?? user?.id;
          const cases = await fetchActiveCases(companyId);
          setActiveCases(cases);
        } catch (error: any) {
          console.error('Error fetching active cases:', error);
          toast.error(error.message || 'Failed to load active cases');
          setActiveCases([]);
        } finally {
          setLoadingCases(false);
        }
      } else {
        // Clear case_id when switching to technical support
        setValue('case_id', null);
        setActiveCases([]);
      }
    };

    loadActiveCases();
  }, [supportTypeValue, setValue, user]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);
      await createSupportTicket(data);
      toast.success('Support ticket created successfully!');
      router.push(paths.dashboard.supportTicket.root);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create support ticket');
    } finally {
      setLoading(false);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Create Support Ticket
            </Typography>

            <Stack spacing={3}>
              <Field.Select
                name="support_type"
                label="Support Type"
                placeholder="Select support type..."
              >
                <MenuItem value="legal_support">Legal Support</MenuItem>
                <MenuItem value="technical_support">Technical Support</MenuItem>
              </Field.Select>

              {supportTypeValue === 'legal_support' && (
                <Field.Select
                  name="case_id"
                  label="Case"
                  placeholder={loadingCases ? "Loading cases..." : "Select a case..."}
                  disabled={loadingCases}
                >
                  {activeCases.length === 0 && !loadingCases && (
                    <MenuItem value="" disabled>
                      No active cases available
                    </MenuItem>
                  )}
                  {activeCases.map((caseItem) => (
                    <MenuItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_id} - {caseItem.subject || caseItem.title || 'Untitled'}
                    </MenuItem>
                  ))}
                </Field.Select>
              )}

              <Field.Text
                name="title"
                label="Subject"
                placeholder="Enter ticket subject..."
              />

              <Field.Text
                name="content"
                label="Message"
                multiline
                rows={6}
                placeholder="Describe your issue or question..."
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={statusValue === 'closed'}
                    onChange={(event) => {
                      setValue('status', event.target.checked ? 'closed' : 'open');
                    }}
                  />
                }
                label="Mark as closed after creation"
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" loading={loading}>
                  Create Ticket
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}