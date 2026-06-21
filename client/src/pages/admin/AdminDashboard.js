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

const SectionHeading = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: ${({ theme }) => theme.spacing.xl} 0 ${({ theme }) => theme.spacing.md};
`;

const RevenueValue = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.success || '#10B981'};
`;

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  const s = stats;

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview" />

      {/* Users */}
      <SectionHeading>Users</SectionHeading>
      <StatsGrid>
        <Card>
          <StatLabel>Total Users</StatLabel>
          <StatValue>{s ? s.total : '--'}</StatValue>
        </Card>
        <Card>
          <StatLabel>Hotel Owners</StatLabel>
          <StatValue>{s ? s.hotelOwners : '--'}</StatValue>
        </Card>
        <Card>
          <StatLabel>Content Creators</StatLabel>
          <StatValue>{s ? s.influencers : '--'}</StatValue>
        </Card>
        <Card>
          <StatLabel>Admins</StatLabel>
          <StatValue>{s ? s.admins : '--'}</StatValue>
        </Card>
        <Card>
          <StatLabel>Banned Users</StatLabel>
          <StatValue>{s ? s.banned : '--'}</StatValue>
        </Card>
      </StatsGrid>

      {/* Campaigns */}
      <SectionHeading>Campaigns</SectionHeading>
      <StatsGrid>
        <Card>
          <StatLabel>Total Campaigns</StatLabel>
          <StatValue>{s ? s.totalCampaigns : '--'}</StatValue>
        </Card>
        <Card>
          <StatLabel>Pending Approval</StatLabel>
          <StatValue>{s ? s.pendingCampaigns : '--'}</StatValue>
        </Card>
        <Card>
          <StatLabel>Active (Upcoming + Ongoing)</StatLabel>
          <StatValue>{s ? s.ongoingCampaigns : '--'}</StatValue>
        </Card>
        <Card>
          <StatLabel>Completed</StatLabel>
          <StatValue>{s ? s.doneCampaigns : '--'}</StatValue>
        </Card>
      </StatsGrid>

      {/* Payments */}
      <SectionHeading>Payments</SectionHeading>
      <StatsGrid>
        <Card>
          <StatLabel>Total Revenue</StatLabel>
          <RevenueValue>{s ? `$${s.totalRevenue.toFixed(2)}` : '--'}</RevenueValue>
        </Card>
        <Card>
          <StatLabel>Successful Payments</StatLabel>
          <StatValue>{s ? s.totalPayments : '--'}</StatValue>
        </Card>
      </StatsGrid>
    </>
  );
};

export default AdminDashboard;
