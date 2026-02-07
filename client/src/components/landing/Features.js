import React from 'react';
import styled from 'styled-components';
import Card from '../ui/Card';

const Section = styled.section`
  padding: ${({ theme }) => theme.spacing['2xl']} 0;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: 960px;
  margin: 0 auto;
`;

const StepNumber = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary}15;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const StepTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StepDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const steps = [
  { title: 'Sign Up', desc: 'Create an account as a hotel owner or influencer. Verify your email to get started.' },
  { title: 'Set Up Profile', desc: 'Hotel owners list their properties. Influencers link their social platforms.' },
  { title: 'Collaborate', desc: 'Browse opportunities, send proposals, and start creating content together.' },
];

const Features = () => (
  <Section>
    <SectionTitle>How It Works</SectionTitle>
    <Grid>
      {steps.map((step, i) => (
        <Card key={i}>
          <StepNumber>{i + 1}</StepNumber>
          <StepTitle>{step.title}</StepTitle>
          <StepDesc>{step.desc}</StepDesc>
        </Card>
      ))}
    </Grid>
  </Section>
);

export default Features;
