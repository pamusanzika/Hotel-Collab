import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import CampaignCard from '../../components/campaigns/CampaignCard';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

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

const InfluencerApplications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/campaigns?tab=applications');
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <>
      <PageHeader title="My Applications" subtitle="Incoming campaign proposals for you to review" />

      {loading ? (
        <Card>
          <EmptyState>Loading...</EmptyState>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card>
          <EmptyState>No pending applications. When hotels propose campaigns, they will appear here.</EmptyState>
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
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </CampaignList>
      )}
    </>
  );
};

export default InfluencerApplications;
