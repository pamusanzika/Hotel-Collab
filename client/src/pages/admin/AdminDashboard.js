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

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview" />
      <StatsGrid>
        <Card>
          <StatLabel>Total Users</StatLabel>
          <StatValue>{stats ? stats.total : '--'}</StatValue>
        </Card>
        <Card>
          <StatLabel>Hotel Owners</StatLabel>
          <StatValue>{stats ? stats.hotelOwners : '--'}</StatValue>
        </Card>
        <Card>
          <StatLabel>Influencers</StatLabel>
          <StatValue>{stats ? stats.influencers : '--'}</StatValue>
        </Card>
        <Card>
          <StatLabel>Admins</StatLabel>
          <StatValue>{stats ? stats.admins : '--'}</StatValue>
        </Card>
        <Card>
          <StatLabel>Banned Users</StatLabel>
          <StatValue>{stats ? stats.banned : '--'}</StatValue>
        </Card>
      </StatsGrid>
    </>
  );
};

export default AdminDashboard;
