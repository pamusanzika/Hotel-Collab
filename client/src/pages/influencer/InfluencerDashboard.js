import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import api from '../../api/axios';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const StatLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatValue = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
`;

const InfluencerDashboard = () => {
  const [stats, setStats] = useState({ total: 0, ongoing: 0, pendingApplications: 0 });
  const [platformCount, setPlatformCount] = useState(0);

  useEffect(() => {
    api.get('/campaigns/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {});
    api.get('/influencer/profile')
      .then(({ data }) => setPlatformCount((data.linkedPlatforms || []).length))
      .catch(() => {});
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your collaboration overview" />
      <StatsGrid>
        <Card>
          <StatLabel>Linked Platforms</StatLabel>
          <StatValue>{platformCount}</StatValue>
        </Card>
        <Card>
          <StatLabel>Active Collaborations</StatLabel>
          <StatValue>{stats.ongoing || 0}</StatValue>
        </Card>
        <Card>
          <StatLabel>Pending Applications</StatLabel>
          <StatValue>{stats.pendingApplications || 0}</StatValue>
        </Card>
        <Card>
          <StatLabel>Waiting for Approval</StatLabel>
          <StatValue>{stats.waitingForApproval || 0}</StatValue>
        </Card>
        <Card>
          <StatLabel>Upcoming Campaigns</StatLabel>
          <StatValue>{stats.upcoming || 0}</StatValue>
        </Card>
        <Card>
          <StatLabel>Completed</StatLabel>
          <StatValue>{stats.done || 0}</StatValue>
        </Card>
      </StatsGrid>
    </>
  );
};

export default InfluencerDashboard;
