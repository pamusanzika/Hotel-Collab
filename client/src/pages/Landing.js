import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import Hero from '../components/landing/Hero';
import Aboutus from '../components/landing/Aboutus';
import Features from '../components/landing/Features';
import Contactus from '../components/landing/Contactus';
import Container from '../components/layout/Container';

const Footer = styled.footer`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const FooterLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Landing = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const el = document.getElementById(location.state.scrollTo);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location.state]);

  return (
    <>
      <Container>
        <Hero />
        <Aboutus />
        <Features />
        <Contactus />
      </Container>
      <Footer>
        <FooterLinks>
          <FooterLink to="/privacy-policy">Privacy Policy</FooterLink>
          <FooterLink to="/terms-conditions">Terms &amp; Conditions</FooterLink>
        </FooterLinks>
        &copy; {new Date().getFullYear()} Influspark. All rights reserved.
      </Footer>
    </>
  );
};

export default Landing;
