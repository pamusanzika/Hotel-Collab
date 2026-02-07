import React from 'react';
import styled from 'styled-components';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Container from '../components/layout/Container';

const Footer = styled.footer`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const Landing = () => (
  <>
    <Header />
    <Container>
      <Hero />
      <Features />
    </Container>
    <Footer>&copy; {new Date().getFullYear()} HotelCollab. All rights reserved.</Footer>
  </>
);

export default Landing;
