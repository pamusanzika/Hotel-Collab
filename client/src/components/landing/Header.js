import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Button from '../ui/Button';

const HeaderWrapper = styled.header`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin: 20px auto;
  border-radius: ${({ theme }) => theme.radius.full};
  max-width: 1200px;
`;

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
`;

const Logo = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  background: white;

  img {
    height: 64px;
    width: auto;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const NavLink = styled.a`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  button {
    padding-bottom: 8px;
  }
`;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (hash) => (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/', { state: { scrollTo: hash } });
    }
  };

  return (
    <HeaderWrapper>
      <Inner>
        <Logo onClick={() => navigate('/')}>
          <img src="/logo-3.svg" alt="Influspark" />
        </Logo>
        <Nav>
          <NavLink href="#about" onClick={handleNavClick('about')}>About Us</NavLink>
          <NavLink href="#how-it-works" onClick={handleNavClick('how-it-works')}>How It Works</NavLink>
          <NavLink href="#contact" onClick={handleNavClick('contact')}>Contact Us</NavLink>
        </Nav>
        <NavActions>
          <Button $variant="ghost" $size="sm" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button $variant="primary" $size="sm" onClick={() => navigate('/apply')}>
            Apply
          </Button>
        </NavActions>
      </Inner>
    </HeaderWrapper>
  );
};

export default Header;
