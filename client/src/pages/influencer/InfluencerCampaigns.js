import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import CampaignCard from '../../components/campaigns/CampaignCard';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const TabBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const Tab = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: none;
  border: none;
  border-bottom: 2px solid ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.textSecondary)};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CampaignList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const InfluencerCampaigns = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/campaigns?tab=${tab}`);
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/campaigns/${id}/status`, { status: 'upcoming' });
      load();
    } catch (err) {
      // handled in UI
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/campaigns/${id}/status`, { status: 'rejected' });
      load();
    } catch (err) {
      // handled in UI
    }
  };

  const emptyMessages = {
    campaigns: 'No active campaigns. Create a campaign to get started!',
    applications: 'No pending applications.',
    history: 'No completed or archived campaigns yet.',
  };

  return (
    <>
      <HeaderRow>
        <PageHeader title="Campaigns" subtitle="Your campaign collaborations" />
        <Button $variant="primary" onClick={() => navigate('/influencer/campaigns/create')}>
          Create Campaign
        </Button>
      </HeaderRow>

      <TabBar>
        <Tab $active={tab === 'campaigns'} onClick={() => setTab('campaigns')}>
          Campaigns
        </Tab>
        <Tab $active={tab === 'applications'} onClick={() => setTab('applications')}>
          Applications
        </Tab>
        <Tab $active={tab === 'history'} onClick={() => setTab('history')}>
          History
        </Tab>
      </TabBar>

      {loading ? (
        <Card>
          <EmptyState>Loading...</EmptyState>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card>
          <EmptyState>{emptyMessages[tab]}</EmptyState>
        </Card>
      ) : (
        <CampaignList>
          {campaigns.map((c) => (
            <CampaignCard
              key={c._id}
              campaign={c}
              currentUserRole="influencer"
              currentUserId={user._id}
              onViewDetails={(id) => navigate(`/influencer/campaigns/${id}`)}
              onApprove={tab === 'applications' ? handleApprove : undefined}
              onReject={tab === 'applications' ? handleReject : undefined}
            />
          ))}
        </CampaignList>
      )}
    </>
  );
};

export default InfluencerCampaigns;
