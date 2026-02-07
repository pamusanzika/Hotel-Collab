import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Button from '../ui/Button';
import Container from '../layout/Container';

const HeaderWrapper = styled.header`
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
`;

const Logo = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};

  span {
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Header = () => {
  const navigate = useNavigate();

  return (
    <HeaderWrapper>
      <Container>
        <Inner>
          <Logo>Hotel<span>Collab</span></Logo>
          <NavActions>
            <Button $variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button $variant="primary" onClick={() => navigate('/apply')}>
              Apply
            </Button>
          </NavActions>
        </Inner>
      </Container>
    </HeaderWrapper>
  );
};

export default Header;
