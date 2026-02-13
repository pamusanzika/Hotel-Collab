import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

const SidebarWrapper = styled.aside`
  width: ${({ theme }) => theme.sidebar.width};
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  flex-direction: column;
  z-index: 100;
`;

const Logo = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;

  img {
    height: 60px;
    width: auto;
  }
`;

const Nav = styled.nav`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0.6rem ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
  }

  &.active {
    background: ${({ theme }) => theme.colors.primary}10;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  }
`;

const NavBadge = styled.span`
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: 0.65rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  min-width: 18px;
  height: 18px;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  margin-left: auto;
`;

const Sidebar = ({ logoText, logoSrc, items }) => (
  <SidebarWrapper>
    <Logo>
      {logoSrc ? <img src={logoSrc} alt={logoText || 'Logo'} /> : logoText}
    </Logo>
    <Nav>
      {items.map((item) => (
        <StyledNavLink key={item.to} to={item.to} end={item.end}>
          {item.icon && <span>{item.icon}</span>}
          {item.label}
          {item.badge > 0 && (
            <NavBadge>{item.badge > 99 ? '99+' : item.badge}</NavBadge>
          )}
        </StyledNavLink>
      ))}
    </Nav>
  </SidebarWrapper>
);

export default Sidebar;
