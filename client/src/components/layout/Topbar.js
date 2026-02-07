import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../../hooks/useAuth';

const TopbarWrapper = styled.header`
  height: ${({ theme }) => theme.topbar.height};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 ${({ theme }) => theme.spacing.xl};
  position: sticky;
  top: 0;
  z-index: 50;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const UserName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const RoleBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: capitalize;
`;

const LogoutBtn = styled.button`
  margin-left: ${({ theme }) => theme.spacing.md};
  padding: 0.35rem 0.75rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const Topbar = () => {
  const { user, logout } = useAuth();

  return (
    <TopbarWrapper>
      <UserInfo>
        <div>
          <UserName>{user?.name}</UserName>
          <RoleBadge> &middot; {user?.role?.replace('_', ' ')}</RoleBadge>
        </div>
        <LogoutBtn onClick={logout}>Log out</LogoutBtn>
      </UserInfo>
    </TopbarWrapper>
  );
};

export default Topbar;
