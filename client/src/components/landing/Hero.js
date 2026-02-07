import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Button from '../ui/Button';

const HeroSection = styled.section`
  padding: ${({ theme }) => theme.spacing['3xl']} 0;
  text-align: center;
  max-width: 680px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.2;

  span {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
`;

const Hero = () => {
  const navigate = useNavigate();

  return (
    <HeroSection>
      <Title>
        Connect Hotels with <span>Influencers</span>
      </Title>
      <Subtitle>
        A platform where hotel owners and content creators collaborate.
        Offer stays, create content, grow together.
      </Subtitle>
      <Actions>
        <Button $variant="primary" $size="lg" onClick={() => navigate('/apply')}>
          Get Started
        </Button>
        <Button $variant="ghost" $size="lg" onClick={() => navigate('/login')}>
          Sign In
        </Button>
      </Actions>
    </HeroSection>
  );
};

export default Hero;
