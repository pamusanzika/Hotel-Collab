import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Section = styled.section`
  position: relative;
  padding: 0px 24px 100px 24px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`;
const Inner = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    max-width: 1200px;
    padding: 28px;
    margin: 0 auto;
    align-items: center;
    animation: ${fadeInUp} 0.7s ease-out;
    border-radius: ${({ theme }) => theme.radius.xl};
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
    box-shadow: ${({ theme }) => theme.shadows.lg};
    backdrop-filter: blur(20px);
    overflow: hidden;

    @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
        grid-template-columns: 1fr;
        gap: 40px;
    }
`;

/* ── Left column ── */
const LeftCol = styled.div`
  position: relative;
`;

const GradientBlob = styled.div`
  position: absolute;
  top: -40px;
  left: -60px;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.22) 0%,
    rgba(251, 113, 133, 0.16) 40%,
    transparent 70%
  );
  filter: blur(50px);
  pointer-events: none;
  z-index: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 260px;
    height: 260px;
    left: -30px;
    top: -20px;
  }
`;

const Heading = styled.h2`
  position: relative;
  z-index: 1;
  font-size: ${({ theme }) => theme.typography.fontSize['5xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.1;
  letter-spacing: -0.5px;
  margin-bottom: 32px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  z-index: 1;
`;

const PersonImage = styled.img`
  width: 100%;
  max-width: 420px;
  border-radius: ${({ theme }) => theme.radius.xl};
  object-fit: cover;
  display: block;
`;

/* floating stat card */
const StatCard = styled.div`
  position: absolute;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 16px 20px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 2;

  ${({ $position }) =>
    $position === 'top'
      ? 'top: 16px; right: -24px;'
      : 'bottom: 24px; left: -16px;'}

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    ${({ $position }) =>
      $position === 'top'
        ? 'top: 8px; right: 0;'
        : 'bottom: 12px; left: 0;'}
  }
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

/* donut chart (pure CSS) */
const Donut = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: conic-gradient(
    ${({ theme }) => theme.colors.secondary} 0% 42%,
    ${({ theme }) => theme.colors.primary} 42% 72%,
    ${({ theme }) => theme.colors.accent} 72% 100%
  );
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 10px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.surface};
  }
`;

const ImageCaption = styled.p`
  position: relative;
  z-index: 1;
  margin-top: 16px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  max-width: 420px;
`;

/* ── Right column ── */
const RightCol = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const GradientBlobRight = styled.div`
  position: absolute;
  bottom: -40px;
  right: -60px;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.22) 0%,
    rgba(251, 113, 133, 0.16) 40%,
    transparent 70%
  );
  filter: blur(50px);
  pointer-events: none;
  z-index: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 260px;
    height: 260px;
    right: -30px;
    bottom: -20px;
  }
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  max-width: 480px;
`;

/* trust / review card */
const TrustCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px 24px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  max-width: 320px;
`;

const TrustHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const TrustBrand = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const Stars = styled.div`
  display: flex;
  gap: 2px;
  margin-bottom: 4px;
`;

const Star = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#14B8A6" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
  </svg>
);

const TrustMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const TrustValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-top: 4px;
`;

const TrustLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Aboutus = () => (
  <Section id="about">
    <Inner>
      {/* Left column */}
      <LeftCol>
        <GradientBlob />
        <Heading>
          Sparking Stories
          <br />
          Around the World
          <br />
          
        </Heading>

        <ImageWrapper>
          <PersonImage
            src="/headshot-tender-cute-curly-haired-20s-woman-warm-beanie-cool-sweatshirt-smiling-broadly-enjoying-awesome-sunny-chilly-days-outdoors-having-fun-posing-blue-background-copy-space.webp"
            alt="Influencer collaborating"
          />

          {/* Floating stat card – top right */}
          <StatCard $position="top">
            <StatLabel>Bonus chart</StatLabel>
            <StatValue>
              5.33K
              <Donut />
            </StatValue>
          </StatCard>

          {/* Floating stat card – bottom left */}
          <StatCard $position="bottom">
            <StatLabel>Active Campaigns</StatLabel>
            <StatValue>1,280+</StatValue>
          </StatCard>
        </ImageWrapper>

        <ImageCaption>
          Assign tasks, chat in real-time, and manage permissions effortlessly.
        </ImageCaption>
      </LeftCol>

      {/* Right column */}
      <RightCol>
        <GradientBlobRight />
        <Description>
       At Influspark, we believe great stories deserve great stages.
Our platform connects hotels and travel influencers to create meaningful collaborations that inspire audiences around the world.
We make it simple for hotels to find the right creators and for influencers to discover stays worth sharing. By bringing hospitality and creativity together, we help transform travel experiences into authentic, engaging content.
Influspark is more than a platform – it’s a community where brands grow, creators shine, and collaborations spark.
        </Description>

        <TrustCard>
          <TrustHeader>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <TrustBrand>Influspark</TrustBrand>
            <TrustMeta>500+ reviews</TrustMeta>
          </TrustHeader>
          <Stars>
            {[...Array(5)].map((_, i) => (
              <Star key={i} />
            ))}
          </Stars>
          <TrustValue>4.9 / 5</TrustValue>
          <TrustLabel>Customer Satisfaction</TrustLabel>
        </TrustCard>
      </RightCol>
    </Inner>
  </Section>
);

export default Aboutus;
