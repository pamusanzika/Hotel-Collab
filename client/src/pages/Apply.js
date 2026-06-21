import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../components/landing/Header';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing['3xl']} 0;
  padding-top: 120px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: 640px;
  margin: 0 auto;
`;

const RoleCard = styled(Card)`
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ $color }) => $color};
  }
`;

const RoleIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  img {
    width: 64px;
    height: 64px;
  }
`;

const RoleTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const RoleDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Apply = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <Container>
        <Wrapper>
          <Title>Join Influspark</Title>
          <Subtitle>Choose how you want to use the platform</Subtitle>
          <RoleGrid>
            <RoleCard $color="#F97316" onClick={() => navigate('/apply/hotel-owner')}>
              <RoleIcon><img src="/Hotel.svg" alt="Hotel" /></RoleIcon>
              <RoleTitle>Hotel Owner</RoleTitle>
              <RoleDesc>
                List your properties and find content creators for collaborations.
              </RoleDesc>
              <Button $variant="primary" $fullWidth>
                Apply as Hotel Owner
              </Button>
            </RoleCard>
            <RoleCard $color="#6366F1" onClick={() => navigate('/apply/influencer')}>
              <RoleIcon><img src="/Influncer.svg" alt="Content Creator" /></RoleIcon>
              <RoleTitle>Content Creator</RoleTitle>
              <RoleDesc>
                Connect your social accounts and discover hotel collaboration offers.
              </RoleDesc>
              <Button $variant="ghost" $fullWidth>
                Apply as Content Creator
              </Button>
            </RoleCard>
          </RoleGrid>
        </Wrapper>
      </Container>
    </>
  );
};

export default Apply;
