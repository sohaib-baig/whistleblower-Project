import type { IChatMessage } from 'src/types/case-details';
import type { HelpDeskChatMessage } from 'src/actions/help-desk';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { useTranslate } from 'src/locales';
import {
  getHelpDeskChats,
  sendHelpDeskAudio,
  sendHelpDeskImage,
  sendHelpDeskMessage,
  markHelpDeskChatsAsRead,
} from 'src/actions/help-desk';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

type Props = {
  requestId: string;
};

export function HelpDeskChat({ requestId }: Props) {
  const { t } = useTranslate('navbar');
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

        const data = await getHelpDeskChats(requestId);
        const convertedMessages: IChatMessage[] = data.map((chat: HelpDeskChatMessage) => {
          const isCurrentUser = chat.created_by && user?.id && chat.created_by === user.id;
          const messageUrl = chat.type !== 'text' ? ensureAbsoluteUrl(chat.message) : chat.message;
          const senderName =
            chat.creator?.name ||
            chat.sender ||
            (isCurrentUser ? t('dashboard.helpDesk.you') : t('dashboard.helpDesk.partner'));

          return {
            id: chat.id,
            message:
              chat.type === 'text'
                ? chat.message
                : chat.type === 'audio'
                  ? t('dashboard.helpDesk.audioMessage')
                  : `${t('dashboard.helpDesk.imageMessage')}: ${chat.message.split('/').pop()}`,
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
          await markHelpDeskChatsAsRead(requestId);
        }
      } catch {
        if (isInitialLoad) {
          setMessages([]);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    },
    [requestId, ensureAbsoluteUrl, t, user?.id]
  );

  useEffect(() => {
    if (requestId) {
      fetchChats(true);
    }
  }, [requestId, fetchChats]);

  useEffect(() => {
    if (!requestId) {
      return undefined;
    }

    const interval = setInterval(() => {
      fetchChats(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [requestId, fetchChats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedMessage = newMessage.trim();

    if (!trimmedMessage) {
      return;
    }

    if (trimmedMessage.length > 5000) {
      return;
    }

    try {
      const sentMessage = await sendHelpDeskMessage(requestId, trimmedMessage);

      const isCurrentUser =
        sentMessage.created_by && user?.id && sentMessage.created_by === user.id;
      const newMessageObj: IChatMessage = {
        id: sentMessage.id,
        message: sentMessage.message,
        sender: user?.name || t('dashboard.helpDesk.you'),
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
    } catch {
      // ignore send error
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

      mediaRecorder.onstop = () => {
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

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        handleSendAudioMessage(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      // ignore mic error
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
      } catch {
        // ignore stop recording error
      }
    }
  };

  const handleSendAudioMessage = async (audioBlob: Blob) => {
    try {
      if (audioBlob.size > 10 * 1024 * 1024) {
        return;
      }

      const file = new File([audioBlob], `audio_${Date.now()}.webm`, { type: audioBlob.type });
      const sentMessage = await sendHelpDeskAudio(requestId, file);
      const audioUrl = ensureAbsoluteUrl(sentMessage.message);
      const isCurrentUser =
        sentMessage.created_by && user?.id && sentMessage.created_by === user.id;

      const newMessageObj: IChatMessage = {
        id: sentMessage.id,
        message: `${t('dashboard.helpDesk.audioMessage')} (${Math.round(audioBlob.size / 1024)}KB)`,
        sender: user?.name || t('dashboard.helpDesk.you'),
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
    } catch {
      // ignore send audio error
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

      const sentMessage = await sendHelpDeskImage(requestId, selectedImage);
      const imageUrl = ensureAbsoluteUrl(sentMessage.message);
      const isCurrentUser =
        sentMessage.created_by && user?.id && sentMessage.created_by === user.id;

      const newMessageObj: IChatMessage = {
        id: sentMessage.id,
        message: `${t('dashboard.helpDesk.imageMessage')}: ${selectedImage.name}`,
        sender: user?.name || t('dashboard.helpDesk.you'),
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
    } catch {
      // ignore send image error
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
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={
                message.messageType === 'audio'
                  ? t('dashboard.helpDesk.voice')
                  : message.messageType === 'image'
                    ? t('dashboard.helpDesk.imageMessage')
                    : t('dashboard.helpDesk.text')
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
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
          <Iconify icon="solar:user-bold" />
        </Avatar>
      )}
    </Stack>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Card sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Stack spacing={2}>
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </Stack>
      </Box>

      {imagePreview && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <img
              src={imagePreview}
              alt="Preview"
              style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
            />
            <Stack spacing={1} flex={1}>
              <Typography variant="body2">{selectedImage?.name}</Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" onClick={handleImageUpload}>
                  {t('dashboard.helpDesk.send')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  {t('dashboard.helpDesk.cancel')}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      )}

      {!imagePreview && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('dashboard.helpDesk.typeMessage')}
              variant="outlined"
              size="small"
            />

            <Tooltip title={t('dashboard.helpDesk.sendImage')}>
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                color="primary"
                disabled={isRecording}
              >
                <Iconify icon="solar:gallery-add-bold" />
              </IconButton>
            </Tooltip>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />

            {!isRecording ? (
              <Tooltip title={t('dashboard.helpDesk.recordAudio')}>
                <IconButton onClick={startRecording} color="primary">
                  <Iconify icon="solar:microphone-bold" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={t('dashboard.helpDesk.stopRecording')}>
                <IconButton onClick={stopRecording} color="error">
                  <Iconify icon="solar:stop-circle-bold" />
                </IconButton>
              </Tooltip>
            )}

            {isRecording && (
              <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
                {formatRecordingTime(recordingTime)}
              </Typography>
            )}

            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isRecording}
              startIcon={<Iconify icon="solar:plain-2-bold" />}
            >
              {t('dashboard.helpDesk.send')}
            </Button>
          </Stack>
        </Box>
      )}
    </Card>
  );
}
