import type { IChatMessage } from 'src/types/case-details';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { processAudioForAnonymity } from 'src/utils/audio-processor';

import { useTranslate } from 'src/locales';
import {
  createCaseLog,
  getLegalSupportChatsAuthenticated,
  sendLegalSupportAudioAuthenticated,
  sendLegalSupportImageAuthenticated,
  sendLegalSupportMessageAuthenticated,
  markLegalSupportMessagesAsReadAuthenticated,
} from 'src/actions/company-case-details';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

type Props = {
  caseId: string;
};

export default function LegalSupportTab({ caseId }: Props) {
  const { t } = useTranslate('navbar');
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const serverUrl = import.meta.env.VITE_SERVER_URL || '';

  const ensureAbsoluteUrl = useCallback(
    (value: string) => (value.startsWith('http') ? value : `${serverUrl}${value}`),
    [serverUrl]
  );

  const fetchChats = useCallback(
    async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }

        const data = await getLegalSupportChatsAuthenticated(caseId);
        const convertedMessages: IChatMessage[] = data.map((chat) => {
          const isCurrentUser = chat.created_by && user?.id && chat.created_by === user.id;
          const messageUrl = chat.type !== 'text' ? ensureAbsoluteUrl(chat.message) : chat.message;
          const senderName =
            chat.creator?.name ||
            chat.sender ||
            (isCurrentUser
              ? t('dashboard.case.legalSupportTab.you')
              : t('dashboard.case.legalSupportTab.partner'));

          return {
            id: chat.id,
            message:
              chat.type === 'text'
                ? chat.message
                : chat.type === 'audio'
                  ? t('dashboard.case.legalSupportTab.audioMessage')
                  : `${t('dashboard.case.legalSupportTab.imageMessage')}: ${chat.message.split('/').pop()}`,
            sender: senderName,
            timestamp: chat.timestamp
              ? new Date(chat.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '',
            type: isCurrentUser ? 'user' : 'system',
            messageType: chat.type,
            audioUrl: chat.type === 'audio' ? messageUrl : undefined,
            imageUrl: chat.type === 'image' ? messageUrl : undefined,
            imageName: chat.type === 'image' ? chat.message.split('/').pop() : undefined,
          };
        });

        setMessages(convertedMessages);

        if (isInitialLoad) {
          try {
            await createCaseLog(caseId, 'Tab Viewed', 'Legal Support Tab (Backend)');
          } catch (logError) {
            console.error('Failed to log legal support tab view:', logError);
          }

          try {
            await markLegalSupportMessagesAsReadAuthenticated(caseId);
            window.dispatchEvent(
              new CustomEvent('legalSupportMessagesMarkedAsRead', { detail: { caseId } })
            );
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('legalSupportMessagesMarkedAsRead', { detail: { caseId } })
              );
            }, 500);
          } catch (markReadError) {
            console.error('Failed to mark legal support messages as read:', markReadError);
          }
        }
      } catch (error) {
        console.error('Error fetching legal support messages:', error);
        if (isInitialLoad) {
          setMessages([]);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    },
    [caseId, ensureAbsoluteUrl, t, user?.id]
  );

  useEffect(() => {
    if (caseId) {
      fetchChats(true);
    }
  }, [caseId, fetchChats]);

  useEffect(() => {
    if (!caseId) {
      return undefined;
    }

    const interval = setInterval(() => {
      fetchChats(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [caseId, fetchChats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedMessage = newMessage.trim();

    if (!trimmedMessage) {
      return;
    }

    if (trimmedMessage.length > 10000) {
      return;
    }

    try {
      const sentMessage = await sendLegalSupportMessageAuthenticated(caseId, trimmedMessage);

      const isCurrentUser =
        sentMessage.created_by && user?.id && sentMessage.created_by === user.id;
      const newMessageObj: IChatMessage = {
        id: sentMessage.id,
        message: sentMessage.message,
        sender: user?.name || t('dashboard.case.legalSupportTab.you'),
        timestamp: sentMessage.timestamp
          ? new Date(sentMessage.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        type: isCurrentUser ? 'user' : 'system',
        messageType: sentMessage.type,
      };

      setMessages((prev) => [...prev, newMessageObj]);
      setNewMessage('');

      try {
        await createCaseLog(
          caseId,
          'Legal Support Message Sent',
          `Text message: ${trimmedMessage.substring(0, 100)}${trimmedMessage.length > 100 ? '...' : ''}`
        );
      } catch (logError) {
        console.error('Failed to log legal support message:', logError);
      }
    } catch (error) {
      console.error('Error sending legal support message:', error);
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

      mediaRecorder.onstop = async () => {
        let mimeType = mediaRecorder.mimeType || 'audio/webm';

        if (mimeType.includes(';')) {
          mimeType = mimeType.split(';')[0];
        }

        if (!mimeType.startsWith('audio/')) {
          mimeType = 'audio/webm';
        }

        if (audioChunksRef.current.length === 0) {
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

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
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
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const handleSendAudioMessage = async (audioBlob: Blob) => {
    try {
      if (audioBlob.size > 10 * 1024 * 1024) {
        return;
      }

      const sentMessage = await sendLegalSupportAudioAuthenticated(caseId, audioBlob);
      const audioUrl = ensureAbsoluteUrl(sentMessage.message);
      const isCurrentUser =
        sentMessage.created_by && user?.id && sentMessage.created_by === user.id;

      const newMessageObj: IChatMessage = {
        id: sentMessage.id,
        message: `${t('dashboard.case.legalSupportTab.audioMessage')} (${Math.round(audioBlob.size / 1024)}KB)`,
        sender: user?.name || t('dashboard.case.legalSupportTab.you'),
        timestamp: sentMessage.timestamp
          ? new Date(sentMessage.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        type: isCurrentUser ? 'user' : 'system',
        messageType: sentMessage.type,
        audioUrl,
      };

      setMessages((prev) => [...prev, newMessageObj]);

      try {
        await createCaseLog(
          caseId,
          'Legal Support Message Sent',
          `Audio message (${Math.round(audioBlob.size / 1024)}KB)`
        );
      } catch (logError) {
        console.error('Failed to log legal support audio message:', logError);
      }
    } catch (error) {
      console.error('Error sending legal support audio message:', error);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    try {
      if (selectedImage.size > 10 * 1024 * 1024) {
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(selectedImage.type)) {
        return;
      }

      const sentMessage = await sendLegalSupportImageAuthenticated(caseId, selectedImage);
      const imageUrl = ensureAbsoluteUrl(sentMessage.message);
      const isCurrentUser =
        sentMessage.created_by && user?.id && sentMessage.created_by === user.id;

      const newMessageObj: IChatMessage = {
        id: sentMessage.id,
        message: `${t('dashboard.case.legalSupportTab.imageMessage')}: ${selectedImage.name}`,
        sender: user?.name || t('dashboard.case.legalSupportTab.you'),
        timestamp: sentMessage.timestamp
          ? new Date(sentMessage.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        type: isCurrentUser ? 'user' : 'system',
        messageType: sentMessage.type,
        imageUrl,
        imageName: selectedImage.name,
      };

      setMessages((prev) => [...prev, newMessageObj]);
      setSelectedImage(null);
      setImagePreview(null);

      try {
        await createCaseLog(caseId, 'Legal Support Message Sent', `Image: ${selectedImage.name}`);
      } catch (logError) {
        console.error('Failed to log legal support image message:', logError);
      }
    } catch (error) {
      console.error('Error sending legal support image message:', error);
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
                  ? t('dashboard.case.legalSupportTab.voice')
                  : message.messageType === 'image'
                    ? t('dashboard.case.legalSupportTab.imageMessage')
                    : t('dashboard.case.legalSupportTab.text')
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
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.message}
            </Typography>
          )}

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

  return (
    <Card sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{t('dashboard.case.legalSupportTab.heading')}</Typography>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
          >
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.case.legalSupportTab.loadingMessages')}
            </Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
          >
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.case.legalSupportTab.noMessages')}
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
                  {t('dashboard.case.legalSupportTab.recording')}{' '}
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
                {t('dashboard.case.legalSupportTab.processingAudio') || 'Processing audio...'}
              </Typography>
            </Stack>
          </Box>
        )}

        {imagePreview && (
          <Box sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedImage?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(selectedImage?.size || 0) / 1024} KB
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={handleImageUpload} variant="contained">
                  {t('dashboard.case.legalSupportTab.send')}
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  {t('dashboard.case.legalSupportTab.cancel')}
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}

        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            placeholder={t('dashboard.case.legalSupportTab.typeMessagePlaceholder')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            multiline
            maxRows={3}
          />

          <Tooltip title={t('dashboard.case.legalSupportTab.attachImage')}>
            <IconButton color="default" onClick={() => fileInputRef.current?.click()}>
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>
          </Tooltip>

          <Tooltip
            title={
              isRecording
                ? t('dashboard.case.legalSupportTab.stopRecording')
                : t('dashboard.case.legalSupportTab.startRecording')
            }
          >
            <IconButton
              color={isRecording ? 'error' : 'default'}
              onClick={isRecording ? stopRecording : startRecording}
            >
              <Iconify icon={isRecording ? 'solar:copy-bold' : 'solar:microphone-bold'} />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('dashboard.case.legalSupportTab.sendMessage')}>
            <IconButton color="primary" onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Iconify icon="custom:send-fill" />
            </IconButton>
          </Tooltip>
        </Stack>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
      </Box>
    </Card>
  );
}
