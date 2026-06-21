import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Section = styled.section`
  position: relative;
  padding:0px 24px 60px 24px;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 60px;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }
`;

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 560px;
  margin: 0 auto;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 32px 24px;
  text-align: center;
  animation: ${fadeInUp} 0.6s ease-out ${({ $delay }) => $delay}s both;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.06);
  }
`;

const IconWrap = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  background: ${({ $bg }) => $bg};
`;

const StepTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const StepDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0;
`;

/* ── inline SVG icons ── */
const ApplyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

const DiscoverIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <path d="M11 8a3 3 0 0 1 3 3" />
  </svg>
);

const ConnectIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="9" y1="10" x2="9" y2="10" />
    <line x1="12" y1="10" x2="12" y2="10" />
    <line x1="15" y1="10" x2="15" y2="10" />
  </svg>
);

const CollaborateIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const steps = [
  {
    title: 'Apply',
    desc: 'Apply to join CollabAway as a travel content creator or host.',
    icon: ApplyIcon,
    bg: 'rgba(99, 102, 241, 0.1)',
  },
  {
    title: 'Discover',
    desc: 'Use our advanced search system to find the perfect collaboration partners.',
    icon: DiscoverIcon,
    bg: 'rgba(251, 113, 133, 0.1)',
  },
  {
    title: 'Connect',
    desc: 'Engage directly through our platform to discuss and finalise collaboration details.',
    icon: ConnectIcon,
    bg: 'rgba(251, 191, 36, 0.1)',
  },
  {
    title: 'Collaborate',
    desc: 'Execute seamless partnerships that benefit both parties and that your audiences will love!',
    icon: CollaborateIcon,
    bg: 'rgba(20, 184, 166, 0.1)',
  },
];

const Features = () => (
  <Section id="how-it-works">
    <SectionHeader>
      <SectionTitle>How It Works</SectionTitle>
      <SectionSubtitle>
        Four simple steps to start creating amazing collaborations.
      </SectionSubtitle>
    </SectionHeader>

    <Grid>
      {steps.map((step, i) => (
        <Card key={step.title} $delay={0.1 * (i + 1)}>
          <IconWrap $bg={step.bg}>
            <step.icon />
          </IconWrap>
          <StepTitle>{step.title}</StepTitle>
          <StepDesc>{step.desc}</StepDesc>
        </Card>
      ))}
    </Grid>
  </Section>
);

export default Features;
