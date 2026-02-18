import type { IChatMessage } from 'src/types/case-details';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { processAudioForAnonymity } from 'src/utils/audio-processor';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/global-config';
import {
  getCaseChats,
  createCaseLog,
  sendChatAudio,
  sendChatImage,
  sendChatMessage,
  markChatMessagesAsRead,
} from 'src/actions/company-case-details';

import { Iconify } from 'src/components/iconify';

import { useChatContext } from '../chat-context';

// ----------------------------------------------------------------------

interface CompanyChatTabProps {
  caseId: string;
  userId: string;
  companySlug: string;
}

// ----------------------------------------------------------------------

export function CompanyChatTab({ caseId, userId, companySlug }: CompanyChatTabProps) {
  const { t } = useTranslate('navbar');
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const { resetChatCount } = useChatContext();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch chat messages from API
  const fetchChats = useCallback(
    async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        const data = await getCaseChats(caseId);
        // Convert chat data to IChatMessage[]
        // Front-end user messages (created_by: null) appear on RIGHT (type: 'user')
        // Case manager/other user messages (created_by: exists) appear on LEFT (type: 'system')
        const convertedMessages: IChatMessage[] = data.map((chat) => {
          const messageUrl = chat.message.startsWith('http')
            ? chat.message
            : `${CONFIG.serverUrl}${chat.message}`;

          // Get sender name: prefer creator name, then sender, fallback to Anonymous
          const senderName =
            chat.creator?.name || chat.sender || t('dashboard.case.chatTab.anonymous', 'Anonymous');

          return {
            id: chat.id,
            message:
              chat.type === 'text'
                ? chat.message
                : chat.type === 'audio'
                  ? t('dashboard.case.chatTab.audioMessage', 'Audio message')
                  : `${t('dashboard.case.chatTab.imageMessage', 'Image')}: ${chat.message.split('/').pop()}`,
            sender: senderName,
            timestamp: new Date(chat.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            type: chat.created_by ? 'system' : 'user', // Inverted: null (front-end) = 'user' (right), exists (case manager) = 'system' (left)
            messageType: chat.type,
            audioUrl: chat.type === 'audio' ? messageUrl : undefined,
            imageUrl: chat.type === 'image' ? messageUrl : undefined,
            imageName: chat.type === 'image' ? chat.message.split('/').pop() : undefined,
          };
        });
        setMessages(convertedMessages);

        // Log tab view and mark messages as read only on initial load
        if (isInitialLoad) {
          try {
            await createCaseLog(caseId, 'Tab Viewed', 'Chat Tab');
          } catch (logError) {
            console.error('Failed to log tab view:', logError);
          }

          // Mark messages as read when chat tab is opened (separate try-catch to ensure it always executes)
          try {
            await markChatMessagesAsRead(caseId);
            // Trigger a custom event to notify the layout to refresh count immediately
            // Dispatch immediately and also after a delay to ensure backend has processed
            window.dispatchEvent(
              new CustomEvent('chatMessagesMarkedAsRead', { detail: { caseId } })
            );
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('chatMessagesMarkedAsRead', { detail: { caseId } })
              );
            }, 500);
          } catch (markReadError) {
            console.error('Failed to mark messages as read:', markReadError);
          }
        }
      } catch (err: any) {
        console.error('Error fetching chat messages:', err);
        if (isInitialLoad) {
          setSnackbarMessage(
            err.message || t('dashboard.case.chatTab.failedToLoad', 'Failed to load chat messages')
          );
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    },
    [caseId, t]
  );

  // Initial load
  useEffect(() => {
    if (caseId) {
      fetchChats(true);
    }
  }, [caseId, fetchChats]);

  // Auto-refresh messages every 3 seconds
  useEffect(() => {
    if (!caseId) {
      return undefined;
    }

    const interval = setInterval(() => {
      fetchChats(false);
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [caseId, fetchChats]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedMessage = newMessage.trim();

    // Client-side validation
    if (!trimmedMessage) {
      setSnackbarMessage(
        t('dashboard.case.chatTab.messageCannotBeEmpty', 'Message cannot be empty')
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (trimmedMessage.length > 10000) {
      setSnackbarMessage(
        t('dashboard.case.chatTab.messageTooLong', 'Message must not exceed 10,000 characters')
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setSending(true);
      await sendChatMessage(caseId, trimmedMessage);

      setNewMessage('');

      // Log the action
      try {
        await createCaseLog(
          caseId,
          'Chat Message Sent',
          `Text message: ${trimmedMessage.substring(0, 100)}${trimmedMessage.length > 100 ? '...' : ''}`
        );
      } catch (logError) {
        console.error('Failed to log chat message:', logError);
      }

      // Reset chat count when user sends a message
      resetChatCount();

      // Refetch messages to get the translated version from the backend
      // Wait a bit to ensure the backend has processed the message
      setTimeout(() => {
        fetchChats(false);
      }, 1000);
    } catch (err: any) {
      setSnackbarMessage(
        err.message || t('dashboard.case.chatTab.failedToSend', 'Failed to send message')
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get supported MIME types, prefer webm or ogg
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
        setSnackbarMessage(
          t('dashboard.case.chatTab.recordingError', 'Recording error occurred. Please try again.')
        );
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      };

      mediaRecorder.onstop = async () => {
        // Use the actual MIME type from MediaRecorder
        let mimeType = mediaRecorder.mimeType || 'audio/webm';

        // Normalize MIME type - remove codec info if present
        if (mimeType.includes(';')) {
          mimeType = mimeType.split(';')[0];
        }

        // Ensure we have a valid MIME type
        if (!mimeType.startsWith('audio/')) {
          mimeType = 'audio/webm';
        }


        if (audioChunksRef.current.length === 0) {
          console.error('No audio chunks recorded');
          setSnackbarMessage(
            t('dashboard.case.chatTab.noAudioData', 'No audio data recorded. Please try again.')
          );
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const originalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());

        // Process audio to alter voice for anonymity
        try {
          setIsProcessingAudio(true);
          const processedBlob = await processAudioForAnonymity(originalBlob);
          handleSendAudioMessage(processedBlob);
        } catch (processingError) {
          console.error('Error processing audio:', processingError);
          // If processing fails, use original blob
          handleSendAudioMessage(originalBlob);
        } finally {
          setIsProcessingAudio(false);
        }
      };

      // Start recording - request data every 1000ms to ensure we get chunks
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);


      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      setSnackbarMessage(
        error.message ||
          t(
            'dashboard.case.chatTab.failedToAccessMicrophone',
            'Failed to access microphone. Please check permissions.'
          )
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        // Request final data before stopping
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } catch (error: any) {
        console.error('Error stopping recording:', error);
        setSnackbarMessage(
          t(
            'dashboard.case.chatTab.errorStoppingRecording',
            'Error stopping recording. Please try again.'
          )
        );
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleSendAudioMessage = async (audioBlob: Blob) => {
    try {
      setSending(true);

      // Client-side validation
      if (audioBlob.size > 10 * 1024 * 1024) {
        setSnackbarMessage(
          t('dashboard.case.chatTab.audioFileTooLarge', 'Audio file size must not exceed 10MB')
        );
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      const sentMessage = await sendChatAudio(caseId, audioBlob);

      // Ensure URL is full path
      const audioUrl = sentMessage.message.startsWith('http')
        ? sentMessage.message
        : `${CONFIG.serverUrl}${sentMessage.message}`;

      // Convert to IChatMessage format and add to messages
      const newMessageObj: IChatMessage = {
        id: sentMessage.id,
        message: `${t('dashboard.case.chatTab.audioMessage', 'Audio message')} (${Math.round(audioBlob.size / 1024)}KB)`,
        sender: t('dashboard.case.chatTab.you', 'You'),
        timestamp: new Date(sentMessage.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'user',
        messageType: sentMessage.type,
        audioUrl,
      };

      setMessages([...messages, newMessageObj]);

      // Log the action
      try {
        await createCaseLog(
          caseId,
          'Chat Message Sent',
          `Audio message (${Math.round(audioBlob.size / 1024)}KB)`
        );
      } catch (logError) {
        console.error('Failed to log audio message:', logError);
      }

      resetChatCount();
    } catch (err: any) {
      setSnackbarMessage(
        err.message || t('dashboard.case.chatTab.failedToSendAudio', 'Failed to send audio message')
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSending(false);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImage) return;

    try {
      setSending(true);

      // Client-side validation
      if (selectedImage.size > 10 * 1024 * 1024) {
        setSnackbarMessage(
          t('dashboard.case.chatTab.imageFileTooLarge', 'Image file size must not exceed 10MB')
        );
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(selectedImage.type)) {
        setSnackbarMessage(
          t(
            'dashboard.case.chatTab.invalidImageType',
            'Invalid image type. Allowed types: JPEG, JPG, PNG, GIF, WEBP'
          )
        );
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      const sentMessage = await sendChatImage(caseId, selectedImage);

      // Ensure URL is full path
      const imageUrl = sentMessage.message.startsWith('http')
        ? sentMessage.message
        : `${CONFIG.serverUrl}${sentMessage.message}`;

      // Convert to IChatMessage format and add to messages
      const newMessageObj: IChatMessage = {
        id: sentMessage.id,
        message: `${t('dashboard.case.chatTab.imageMessage', 'Image')}: ${selectedImage.name}`,
        sender: t('dashboard.case.chatTab.you', 'You'),
        timestamp: new Date(sentMessage.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'user',
        messageType: sentMessage.type,
        imageUrl,
        imageName: selectedImage.name,
      };

      setMessages([...messages, newMessageObj]);
      setSelectedImage(null);
      setImagePreview(null);

      // Log the action
      try {
        await createCaseLog(caseId, 'Chat Message Sent', `Image: ${selectedImage.name}`);
      } catch (logError) {
        console.error('Failed to log image message:', logError);
      }

      resetChatCount();
    } catch (err: any) {
      setSnackbarMessage(
        err.message || t('dashboard.case.chatTab.failedToSendImage', 'Failed to send image')
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = (message: IChatMessage) => (
    <Stack
      key={message.id}
      direction="row"
      spacing={2}
      justifyContent={message.type === 'user' ? 'flex-end' : 'flex-start'}
      sx={{ mb: 2 }}
    >
      {message.type !== 'user' && (
        <Avatar sx={{ width: 32, height: 32 }}>
          <Iconify icon="solar:user-id-bold" />
        </Avatar>
      )}

      <Paper
        sx={{
          p: 2,
          maxWidth: '70%',
          backgroundColor: message.type === 'user' ? 'primary.main' : 'grey.100',
          color: message.type === 'user' ? 'primary.contrastText' : 'text.primary',
        }}
      >
        <Stack spacing={1}>
          {/* Sender Name and Message Type Indicator */}
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                opacity: message.type === 'user' ? 0.9 : 0.8,
                fontSize: '0.75rem',
              }}
            >
              {message.sender}
            </Typography>
            <Chip
              size="small"
              label={
                message.messageType === 'audio'
                  ? t('dashboard.case.chatTab.voice', 'Voice')
                  : message.messageType === 'image'
                    ? t('dashboard.case.chatTab.imageMessage', 'Image')
                    : t('dashboard.case.chatTab.text', 'Text')
              }
              icon={
                <Iconify
                  icon={
                    message.messageType === 'audio'
                      ? 'solar:microphone-bold'
                      : message.messageType === 'image'
                        ? 'solar:gallery-add-bold'
                        : 'solar:chat-round-dots-bold'
                  }
                  width={14}
                />
              }
              sx={{
                fontSize: '0.7rem',
                height: 20,
                backgroundColor:
                  message.type === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                color: message.type === 'user' ? 'white' : 'text.secondary',
              }}
            />
          </Stack>

          {/* Audio Message */}
          {message.messageType === 'audio' && message.audioUrl ? (
            <Box>
              <audio controls style={{ width: '100%', maxWidth: '300px' }}>
                <source src={message.audioUrl} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                {message.message}
              </Typography>
            </Box>
          ) : message.messageType === 'image' && message.imageUrl ? (
            /* Image Message */
            <Box>
              <img
                src={message.imageUrl}
                alt={message.imageName || 'Uploaded image'}
                style={{
                  maxWidth: '300px',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                }}
              />
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                {message.message}
              </Typography>
            </Box>
          ) : (
            /* Text Message */
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.message}
            </Typography>
          )}

          {/* Timestamp */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              opacity: 0.7,
            }}
          >
            {message.timestamp}
          </Typography>
        </Stack>
      </Paper>

      {message.type === 'user' && (
        <Avatar sx={{ width: 32, height: 32 }}>
          <Iconify icon="solar:user-id-bold" />
        </Avatar>
      )}
    </Stack>
  );

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{t('dashboard.case.chatTab.heading', 'Case Chat')}</Typography>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.length === 0 ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
          >
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.case.chatTab.noMessages', 'No messages yet. Start a conversation!')}
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        {/* Recording Indicator */}
        {isRecording && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'error.main',
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 },
                    },
                  }}
                />
                <Typography variant="body2" color="error.main">
                  {t('dashboard.case.chatTab.recording', 'Recording...')}{' '}
                  {formatRecordingTime(recordingTime)}
                </Typography>
              </Box>
              <LinearProgress sx={{ flex: 1 }} />
              <IconButton color="error" onClick={stopRecording} size="small">
                <Iconify icon="solar:copy-bold" />
              </IconButton>
            </Stack>
          </Box>
        )}

        {/* Audio Processing Indicator */}
        {isProcessingAudio && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <LinearProgress sx={{ flex: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.case.chatTab.processingAudio') || 'Processing audio...'}
              </Typography>
            </Stack>
          </Box>
        )}

        {/* Message Input */}
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            placeholder={t(
              'dashboard.case.chatTab.typeMessagePlaceholder',
              'Type your message... (Press Enter to send, Shift+Enter for new line)'
            )}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            multiline
            maxRows={3}
          />

          {/* Image Upload Button */}
          <Tooltip title={t('dashboard.case.chatTab.attachImage', 'Attach Image')}>
            <IconButton
              color="default"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>
          </Tooltip>

          {/* Recording Button */}
          <Tooltip
            title={
              isRecording
                ? t('dashboard.case.chatTab.stopRecording', 'Stop Recording')
                : t('dashboard.case.chatTab.startVoiceRecording', 'Start Voice Recording')
            }
          >
            <IconButton
              color={isRecording ? 'error' : 'default'}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={sending}
            >
              <Iconify icon={isRecording ? 'solar:copy-bold' : 'solar:microphone-bold'} />
            </IconButton>
          </Tooltip>

          {/* Send Button */}
          <Tooltip title={t('dashboard.case.chatTab.send', 'Send Message')}>
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Iconify icon="custom:send-fill" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />

        {/* Image Preview Dialog */}
        {imagePreview && selectedImage && (
          <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2">
                {t('dashboard.case.chatTab.imagePreview', 'Image Preview')}
              </Typography>
              <Box
                component="img"
                src={imagePreview}
                alt="Preview"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: 1,
                  objectFit: 'contain',
                }}
              />
              <Stack direction="row" spacing={1}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={handleImageUpload}
                  sx={{
                    ml: 'auto',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <Iconify icon="solar:upload-bold" />
                </IconButton>
              </Stack>
            </Stack>
          </Box>
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
