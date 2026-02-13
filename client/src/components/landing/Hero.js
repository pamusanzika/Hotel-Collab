import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Button from '../ui/Button';
import Header from './Header';

/* ───── animations ───── */
const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

/* ───── layout ───── */
const HeroSection = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 24px 80px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
    pointer-events: none;
    z-index: 1;
  }
`;

/* gradient glow behind text */
const GradientGlow = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  width: 1000px;
  height: 80vh;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(99, 102, 241, 0.25) 0%,
    rgba(251, 113, 133, 0.18) 35%,
    rgba(251, 191, 36, 0.10) 60%,
    transparent 80%
  );
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 400px;
    height: 280px;
  }
`;

/* ───── text content ───── */
const Content = styled.div`
  position: relative;
  z-index: 2;
  max-width: 800px;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 6px 16px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border: 1px solid ${({ theme }) => theme.colors.text};
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.08);
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['5xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.15;
  margin-bottom: 20px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['6xl']};
  }
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  max-width: 560px;
  margin: 0 auto 36px;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
  flex-wrap: wrap;
`;

/* ───── floating avatar bubbles ───── */
const AvatarBubble = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 8px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.full};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 3;
  animation: ${float} ${({ $delay }) => 4 + $delay * 0.5}s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const Avatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const AvatarName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
`;

/* ───── dashboard preview cards ───── */
const PreviewRow = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 64px;
  animation: ${fadeInUp} 0.8s ease-out 0.3s both;
  flex-wrap: wrap;
  padding: 0 16px;
`;

const PreviewCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 24px 28px;
  min-width: 200px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const PreviewIcon = styled.img`
  width: 64px;
  height: 64px;
  margin-bottom: 10px;
`;

const PreviewInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PreviewLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PreviewValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
`;


const DashboardPreview = styled.div`
  background: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 28px 32px;
  min-width: 280px;
  max-width: 360px;
  box-shadow: ${({ theme }) => theme.shadows.xl};
  color: #fff;
  text-align: left;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    min-width: 200px;
  }
`;

const DashPreviewTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: 6px;
`;

const DashPreviewSub = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 20px;
  line-height: 1.5;
`;

/* simple bar chart made with divs */
const BarChart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 60px;
`;

const Bar = styled.div`
  width: 16px;
  border-radius: 4px 4px 0 0;
  background: ${({ $color }) => $color || 'rgba(255,255,255,0.3)'};
  height: ${({ $h }) => $h}%;
`;

const PEOPLE = [
  { name: 'Mia Taylor', img: '/headshot-tender-cute-curly-haired-20s-woman-warm-beanie-cool-sweatshirt-smiling-broadly-enjoying-awesome-sunny-chilly-days-outdoors-having-fun-posing-blue-background-copy-space.webp', top: '18%', left: '6%', delay: 0 },
  { name: 'Emily Brown', img: '/1.png', top: '14%', right: '5%', delay: 1 },
  { name: 'Daniel Hall', img: '/2.png', bottom: '42%', left: '3%', delay: 2 },
  { name: 'Ava Jackson', img: '/3.png', bottom: '38%', right: '4%', delay: 1.5 },
];

const Hero = () => {
  const navigate = useNavigate();

  return (
    <HeroSection>
      <Header />
      <GradientGlow />

      {/* floating avatar bubbles */}
      {PEOPLE.map((p) => (
        <AvatarBubble
          key={p.name}
          $delay={p.delay}
          style={{ top: p.top, bottom: p.bottom, left: p.left, right: p.right }}
        >
          <Avatar src={p.img} alt={p.name} />
          <AvatarName>{p.name}</AvatarName>
        </AvatarBubble>
      ))}

      {/* hero text */}
      <Content>
        <Badge>Connect. Create. Collaborate.</Badge>
        <Title>
          Connect Hosts with Influencers, Grow Together
        </Title>
        <Subtitle>
          Connecting hosts and influencers to create inspiring stories and unforgettable travel experiences.
        </Subtitle>
        <Actions>
          <Button $variant="primary" $size="lg" onClick={() => navigate('/apply')}>
            Get Started
          </Button>
          <Button $variant="ghost" $size="lg" onClick={() => navigate('/login')}>
            Learn More
          </Button>
        </Actions>
      </Content>

      {/* dashboard preview row */}
      <PreviewRow>
        <PreviewCard>
          <PreviewIcon src="/Hotel.svg" alt="Hotels" />
          <PreviewInfo>
            <PreviewLabel>Active Hotels</PreviewLabel>
            <PreviewValue>1,240 +</PreviewValue>
          </PreviewInfo>
        </PreviewCard>

        <DashboardPreview>
          <DashPreviewTitle>Campaign Analytics</DashPreviewTitle>
          <DashPreviewSub>
            Track collaborations, engagement, and ROI in&nbsp;real-time.
          </DashPreviewSub>
          <BarChart>
            <Bar $h={40} $color="rgba(255,255,255,0.25)" />
            <Bar $h={65} $color="rgba(255,255,255,0.35)" />
            <Bar $h={50} $color="rgba(255,255,255,0.25)" />
            <Bar $h={85} $color="#14B8A6" />
            <Bar $h={70} $color="rgba(255,255,255,0.35)" />
            <Bar $h={55} $color="rgba(255,255,255,0.25)" />
            <Bar $h={90} $color="#6366F1" />
            <Bar $h={60} $color="rgba(255,255,255,0.35)" />
          </BarChart>
        </DashboardPreview>

        <PreviewCard>
          <PreviewIcon src="/Influncer.svg" alt="Influencers" />
          <PreviewInfo>
            <PreviewLabel>Influencers</PreviewLabel>
            <PreviewValue>8,350 +</PreviewValue>
          </PreviewInfo>
        </PreviewCard>
      </PreviewRow>
    </HeroSection>
  );
};

export default Hero;
