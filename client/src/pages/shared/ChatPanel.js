import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import api from '../../api/axios';

// ─── Styled components ─────────────────────────────────────────────────────────

const PanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ChatHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const HeaderName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const HeaderRole = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: capitalize;
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const MessageRow = styled.div`
  display: flex;
  justify-content: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
`;

const Bubble = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.5;
  word-break: break-word;
  position: relative;
  color: #fff;
  border-bottom-right-radius: ${({ $mine }) => ($mine ? '4px' : undefined)};
  border-bottom-left-radius: ${({ $mine }) => ($mine ? undefined : '4px')};
`;

const BubbleMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: 2px;
  justify-content: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
`;

const TimeStamp = styled.span`
  font-size: 0.65rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const SeenLabel = styled.span`
  font-size: 0.65rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const TypingIndicator = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 0 ${({ theme }) => theme.spacing.lg};
  height: 20px;
`;

const InputArea = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.6rem ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SendButton = styled.button`
  padding: 0.6rem ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DateSeparator = styled.div`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: ${({ theme }) => theme.spacing.sm} 0;
`;

// ─── Helpers ────────────────────────────────────────────────────────────────────

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Component ──────────────────────────────────────────────────────────────────

const ChatPanel = ({ conversationId, otherUser }) => {
  const { user } = useAuth();
  const { socket, decrementUnread } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newText, setNewText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    const loadMessages = async () => {
      try {
        const { data } = await api.get(
          `/chat/conversations/${conversationId}/messages`
        );
        if (!cancelled) {
          setMessages(data.messages);
          setTimeout(scrollToBottom, 100);
        }
      } catch {
        // ignore
      }
    };

    loadMessages();

    // Mark as read
    if (socket) {
      socket.emit('markAsRead', { conversationId });
    }

    return () => {
      cancelled = true;
    };
  }, [conversationId, socket, scrollToBottom]);

  // Listen for new messages in this conversation
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handler = (message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 50);

        // Mark as read immediately since user is viewing this conversation
        if (String(message.senderId) !== String(user._id)) {
          socket.emit('markAsRead', { conversationId });
          decrementUnread(1);
        }
      }
    };

    socket.on('newMessage', handler);
    return () => socket.off('newMessage', handler);
  }, [socket, conversationId, user._id, scrollToBottom, decrementUnread]);

  // Listen for read receipts
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handler = ({ conversationId: convId, readBy }) => {
      if (convId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.readBy && !msg.readBy.includes(readBy)
              ? { ...msg, readBy: [...msg.readBy, readBy] }
              : msg
          )
        );
      }
    };

    socket.on('messagesRead', handler);
    return () => socket.off('messagesRead', handler);
  }, [socket, conversationId]);

  // Listen for typing indicator
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handler = ({ conversationId: convId, isTyping }) => {
      if (convId === conversationId) {
        setIsOtherTyping(isTyping);
      }
    };

    socket.on('userTyping', handler);
    return () => socket.off('userTyping', handler);
  }, [socket, conversationId]);

  // Send message
  const handleSend = (e) => {
    e.preventDefault();
    if (!newText.trim() || !socket) return;

    socket.emit('sendMessage', { conversationId, text: newText.trim() });
    setNewText('');

    // Stop typing indicator
    socket.emit('typing', { conversationId, isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  // Typing indicator
  const handleInputChange = (e) => {
    setNewText(e.target.value);
    if (!socket) return;

    socket.emit('typing', { conversationId, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { conversationId, isTyping: false });
    }, 2000);
  };

  if (!conversationId) {
    return (
      <EmptyChat>Select a conversation to start messaging</EmptyChat>
    );
  }

  // Group messages by date
  let lastDate = '';

  return (
    <PanelWrapper>
      {otherUser && (
        <ChatHeader>
          <div>
            <HeaderName>{otherUser.name}</HeaderName>
            <HeaderRole>
              {otherUser.role === 'hotel_owner' ? 'Hotel Owner' : 'Content Creator'}
            </HeaderRole>
          </div>
        </ChatHeader>
      )}

      <MessagesArea>
        {messages.length === 0 && (
          <EmptyChat>No messages yet. Say hello!</EmptyChat>
        )}
        {messages.map((msg) => {
          const mine = String(msg.senderId) === String(user._id);
          const msgDate = formatDate(msg.createdAt);
          let showDate = false;
          if (msgDate !== lastDate) {
            lastDate = msgDate;
            showDate = true;
          }

          const isRead =
            mine &&
            msg.readBy &&
            msg.readBy.length > 1;

          // Determine sender role: use senderRole from server, fallback to client-side logic
          const role = msg.senderRole || (mine ? user.role : otherUser?.role) || '';
          const bubbleColor = role === 'hotel_owner' ? '#6366F1' : '#F97316';

          return (
            <React.Fragment key={msg._id}>
              {showDate && <DateSeparator>{msgDate}</DateSeparator>}
              <MessageRow $mine={mine}>
                <div>
                  <Bubble $mine={mine} style={{ background: bubbleColor }}>{msg.text}</Bubble>
                  <BubbleMeta $mine={mine}>
                    <TimeStamp>{formatTime(msg.createdAt)}</TimeStamp>
                    {isRead && <SeenLabel>Seen</SeenLabel>}
                  </BubbleMeta>
                </div>
              </MessageRow>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </MessagesArea>

      <TypingIndicator>
        {isOtherTyping ? `${otherUser?.name || 'User'} is typing...` : ''}
      </TypingIndicator>

      <InputArea onSubmit={handleSend}>
        <MessageInput
          type="text"
          placeholder="Type a message..."
          value={newText}
          onChange={handleInputChange}
          autoFocus
        />
        <SendButton type="submit" disabled={!newText.trim()}>
          Send
        </SendButton>
      </InputArea>
    </PanelWrapper>
  );
};

export default ChatPanel;
