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

const OwnerDashboard = () => {
  const [stats, setStats] = useState({ total: 0, ongoing: 0, pendingApplications: 0 });
  const [hotelCount, setHotelCount] = useState(0);

  useEffect(() => {
    api.get('/campaigns/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {});
    api.get('/hotels')
      .then(({ data }) => setHotelCount((data.hotels || []).length))
      .catch(() => {});
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your hotel listings and collaborations" />
      <StatsGrid>
        <Card>
          <StatLabel>Total Hotels</StatLabel>
          <StatValue>{hotelCount}</StatValue>
        </Card>
        <Card>
          <StatLabel>Active Collaborations</StatLabel>
          <StatValue>{stats.ongoing || 0}</StatValue>
        </Card>
        <Card>
          <StatLabel>Pending Requests</StatLabel>
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

export default OwnerDashboard;
