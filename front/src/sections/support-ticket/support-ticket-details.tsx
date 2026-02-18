import type { ISupportTicket, ISupportTicketChat, ISupportTicketChatForm } from 'src/types/support-ticket';

import { useForm } from 'react-hook-form';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useParams } from 'src/routes/hooks';

import { fDate, fTime } from 'src/utils/format-time';

import {
  fetchSupportTicket,
  fetchSupportTicketChats,
  createSupportTicketChat,
  updateSupportTicketStatus,
  markSupportTicketChatsAsRead,
} from 'src/actions/support-ticket';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

export function SupportTicketDetailsView() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<ISupportTicket | null>(null);
  const [chats, setChats] = useState<ISupportTicketChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const methods = useForm<ISupportTicketChatForm>({
    defaultValues: {
      support_ticket_id: id || '',
      content: '',
    },
  });

  const { handleSubmit, reset, watch, setValue } = methods;
  const contentValue = watch('content');

  // Fetch ticket data
  useEffect(() => {
    const loadTicket = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const ticketData = await fetchSupportTicket(id);
        setTicket(ticketData);

        // Prefer chats from ticket payload if available
        if (ticketData && Array.isArray(ticketData.chats)) {
          setChats(ticketData.chats);
        } else {
          try {
            const chatsData = await fetchSupportTicketChats(id);
            const chatsArray = Array.isArray(chatsData.data) ? chatsData.data : [];
            setChats(chatsArray);
          } catch {
            setChats([]); // Set empty array on error
          }
        }

        // Mark chats as read (don't fail the whole load if this fails)
        await markSupportTicketChatsAsRead(id);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load support ticket');
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [id]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  const onSubmitReply = handleSubmit(async (data) => {
    if (!ticket) return;

    try {
      setSending(true);
      // Ensure support_ticket_id is always present
      const payload = {
        ...data,
        support_ticket_id: ticket.id,
      };
      const newChat = await createSupportTicketChat(payload);

      // Fallback shape if sender/receiver are missing
      const safeChat = {
        ...newChat,
        sender: newChat.sender || {
          id: newChat.reply_from,
          name: 'You',
        },
        receiver: newChat.receiver || undefined,
      };

      setChats((prev) => [...prev, safeChat]);
      reset({ support_ticket_id: ticket.id, content: '' });
      // Extra safety to clear field
      setValue('content', '');
      toast.success('Reply sent successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  });

  const handleStatusChange = async (newStatus: 'open' | 'closed') => {
    if (!ticket) return;

    try {
      await updateSupportTicketStatus(ticket.id, newStatus);
      setTicket(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Ticket ${newStatus === 'closed' ? 'closed' : 'reopened'} successfully!`);
    } catch {
      toast.error('Failed to update ticket status');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!ticket || !ticket.id) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography variant="h6">Support ticket not found</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Ticket data: {JSON.stringify(ticket)}
        </Typography>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {ticket.title}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Ticket #{ticket.id.slice(-8)}
                </Typography>
                <Label
                  variant="soft"
                  color={ticket.status === 'open' ? 'success' : 'default'}
                >
                  {ticket.status}
                </Label>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
              {ticket.status === 'open' && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleStatusChange('closed')}
                >
                  Close Ticket
                </Button>
              )}
              {ticket.status === 'closed' && (
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  onClick={() => handleStatusChange('open')}
                >
                  Reopen Ticket
                </Button>
              )}
            </Stack>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Chat Messages */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Conversation
            </Typography>

            <Scrollbar sx={{ maxHeight: 400, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Stack spacing={3}>
                {Array.isArray(chats) ? (
                  chats.length > 0 ? (
                    chats
                      .filter((chat) => chat && chat.id)
                      .map((chat) => <ChatMessage key={chat.id} chat={chat} />)
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No messages yet. Start a conversation!
                    </Typography>
                  )
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Loading conversation...
                  </Typography>
                )}
                <div ref={chatEndRef} />
              </Stack>
            </Scrollbar>
          </Box>

          {/* Reply Form */}
          {ticket.status === 'open' && (
            <Form methods={methods} onSubmit={onSubmitReply}>
              <Stack spacing={2}>
                <Field.Text
                  name="content"
                  label="Your Reply"
                  multiline
                  rows={3}
                  placeholder="Type your reply here..."
                />

                <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Press Enter to send, Shift+Enter for new line
                  </Typography>

                  <Button
                    type="submit"
                    variant="contained"
                    loading={sending}
                    disabled={!contentValue?.trim()}
                  >
                    Send Reply
                  </Button>
                </Stack>
              </Stack>
            </Form>
          )}

          {ticket.status === 'closed' && (
            <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
              <Typography variant="body2" color="warning.darker">
                This ticket is closed. You cannot send new replies.
              </Typography>
            </Box>
          )}
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Ticket Information
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Created By
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                <Avatar sx={{ width: 24, height: 24 }}>
                  {ticket.creator.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="body2">{ticket.creator.name}</Typography>
              </Stack>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Created Date
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {fDate(ticket.created_at)} at {fTime(ticket.created_at)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Label
                variant="soft"
                color={ticket.status === 'open' ? 'success' : 'default'}
                sx={{ mt: 0.5 }}
              >
                {ticket.status}
              </Label>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Messages
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {chats.length}
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}

// ----------------------------------------------------------------------

function ChatMessage({ chat }: { chat: ISupportTicketChat }) {
  const theme = useTheme();
  const isAdmin = chat.created_from === 'admin';

  // Defensive sender/receiver fallbacks
  const sender = chat.sender || { id: chat.reply_from, name: 'Unknown' };

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        flexDirection: isAdmin ? 'row' : 'row-reverse',
      }}
    >
      <Avatar sx={{ width: 32, height: 32 }}>
        {sender.name ? sender.name.charAt(0).toUpperCase() : '?'}
      </Avatar>

      <Box
        sx={{
          maxWidth: '70%',
          p: 2,
          borderRadius: 2,
          bgcolor: isAdmin ? theme.palette.primary.lighter : theme.palette.grey[100],
          border: `1px solid ${isAdmin ? theme.palette.primary.light : theme.palette.grey[300]}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="subtitle2">
            {sender.name || 'Unknown'}
          </Typography>
          <Label
            variant="soft"
            color={isAdmin ? 'primary' : 'default'}
            sx={{ fontSize: '0.75rem', height: 20 }}
          >
            {chat.created_from}
          </Label>
        </Stack>

        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {chat.content}
        </Typography>

        {chat.attachment && (
          <Box sx={{ mt: 1 }}>
            <IconButton size="small">
              <Iconify icon="eva:download-fill" />
            </IconButton>
            <Typography variant="caption" color="text.secondary">
              Attachment
            </Typography>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {fDate(chat.created_at)} at {fTime(chat.created_at)}
        </Typography>
      </Box>
    </Stack>
  );
}