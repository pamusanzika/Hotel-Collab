import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import api from '../../api/axios';
import ChatPanel from './ChatPanel';

// ─── Styled components ─────────────────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  height: calc(100vh - 140px);
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
`;

const ConversationListPanel = styled.div`
  width: 340px;
  min-width: 280px;
  border-right: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  flex-direction: column;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    ${({ $hideOnMobile }) => $hideOnMobile && 'display: none;'}
    ${({ $hideOnMobile }) => !$hideOnMobile && 'width: 100%;'}
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    ${({ $hideOnMobile }) => $hideOnMobile && 'display: none;'}
  }
`;

const SearchBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConvItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  ${({ $active, theme }) =>
    $active
      ? `background: ${theme.colors.primary}10; border-left: 3px solid ${theme.colors.primary};`
      : `border-left: 3px solid transparent;`}

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  flex-shrink: 0;
`;

const ConvInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConvHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ConvName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const ConvTime = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  flex-shrink: 0;
`;

const ConvPreview = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadBadge = styled.span`
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: 0.65rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  min-width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  flex-shrink: 0;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const BackButton = styled.button`
  display: none;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`;

// ─── Helpers ────────────────────────────────────────────────────────────────────

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const formatConvTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ─── Component ──────────────────────────────────────────────────────────────────

const Messages = () => {
  const { conversationId: paramConvId } = useParams();
  const { user } = useAuth();
  const { socket, setUnreadCount } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(paramConvId || null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Load conversations
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/chat/conversations');
        setConversations(data.conversations);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // If paramConvId changes, update active
  useEffect(() => {
    if (paramConvId) setActiveConvId(paramConvId);
  }, [paramConvId]);

  // Listen for new messages to update conversation list
  useEffect(() => {
    if (!socket) return;

    const handler = (message) => {
      setConversations((prev) => {
        const idx = prev.findIndex(
          (c) => c._id === message.conversationId
        );
        if (idx === -1) {
          // New conversation — reload the list
          api
            .get('/chat/conversations')
            .then(({ data }) => setConversations(data.conversations))
            .catch(() => {});
          return prev;
        }

        const updated = [...prev];
        const conv = { ...updated[idx] };
        conv.lastMessage = {
          text: message.text,
          senderId: message.senderId,
          createdAt: message.createdAt,
        };

        // Update unread count
        if (String(message.senderId) !== String(user._id)) {
          if (message.conversationId === activeConvId) {
            // User is viewing this conversation, don't increment
          } else {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
            setUnreadCount((prev) => prev + 1);
          }
        }

        // Move to top
        updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });
    };

    socket.on('newMessage', handler);
    return () => socket.off('newMessage', handler);
  }, [socket, user._id, activeConvId, setUnreadCount]);

  // Listen for messagesRead to update conversation unread counts
  useEffect(() => {
    if (!socket) return;

    const handler = ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
    };

    socket.on('messagesRead', handler);
    return () => socket.off('messagesRead', handler);
  }, [socket]);

  // When selecting a conversation, mark it as read
  const handleSelectConv = (convId) => {
    setActiveConvId(convId);

    // Clear unread for this conversation
    const conv = conversations.find((c) => c._id === convId);
    if (conv && conv.unreadCount > 0) {
      setUnreadCount((prev) => Math.max(0, prev - conv.unreadCount));
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  // Get the other user for the active conversation
  const activeConv = conversations.find((c) => c._id === activeConvId);
  const otherUser = activeConv?.participants?.find(
    (p) => String(p._id) !== String(user._id)
  );

  // Filter conversations by search
  const filtered = useMemo(() => {
    if (!search) return conversations;
    const lower = search.toLowerCase();
    return conversations.filter((conv) => {
      const other = conv.participants?.find((p) => String(p._id) !== String(user._id));
      return other?.name?.toLowerCase().includes(lower);
    });
  }, [conversations, search, user._id]);

  return (
    <>
      <PageHeader title="Messages" subtitle="Chat with your connections" />
      <Container>
        {/* ── Conversation list ──────────────────────────────────────── */}
        <ConversationListPanel $hideOnMobile={!!activeConvId}>
          <SearchBox>
            <SearchInput
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchBox>
          <ConversationList>
            {loading && <EmptyState>Loading conversations...</EmptyState>}
            {!loading && filtered.length === 0 && (
              <EmptyState>
                {search
                  ? 'No conversations match your search.'
                  : 'No conversations yet. Start chatting from a profile page!'}
              </EmptyState>
            )}
            {filtered.map((conv) => {
              const other = conv.participants?.find(
                (p) => String(p._id) !== String(user._id)
              );
              if (!other) return null;

              return (
                <ConvItem
                  key={conv._id}
                  $active={conv._id === activeConvId}
                  onClick={() => handleSelectConv(conv._id)}
                >
                  <Avatar>{getInitials(other.name)}</Avatar>
                  <ConvInfo>
                    <ConvHeader>
                      <ConvName>{other.name}</ConvName>
                      <ConvTime>
                        {formatConvTime(conv.lastMessage?.createdAt)}
                      </ConvTime>
                    </ConvHeader>
                    <ConvPreview>
                      {conv.lastMessage?.text || 'No messages yet'}
                    </ConvPreview>
                  </ConvInfo>
                  {conv.unreadCount > 0 && (
                    <UnreadBadge>
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </UnreadBadge>
                  )}
                </ConvItem>
              );
            })}
          </ConversationList>
        </ConversationListPanel>

        {/* ── Chat area ──────────────────────────────────────────────── */}
        <ChatArea $hideOnMobile={!activeConvId}>
          {activeConvId && (
            <BackButton onClick={() => setActiveConvId(null)}>
              ← Back to conversations
            </BackButton>
          )}
          <ChatPanel
            conversationId={activeConvId}
            otherUser={otherUser}
          />
        </ChatArea>
      </Container>
    </>
  );
};

export default Messages;
