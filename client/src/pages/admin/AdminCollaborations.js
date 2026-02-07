import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../api/axios';

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const Filters = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const FilterBtn = styled(Button)`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const SearchInput = styled.input`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  width: 100%;
  max-width: 320px;
  outline: none;
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  vertical-align: middle;
`;

const TypeLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: capitalize;
`;

const STATUS_VARIANT = {
  pending: 'pending',
  upcoming: 'info',
  ongoing: 'active',
  done: 'active',
  cancelled: 'banned',
  rejected: 'banned',
};

const STATUS_LABEL = {
  pending: 'Pending',
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  done: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const TYPE_LABEL = {
  free_stay: 'Free Stay',
  paid_collaboration: 'Paid Collaboration',
  discount_stay: 'Discount Stay',
};

const STATUSES = ['', 'pending', 'upcoming', 'ongoing', 'done', 'cancelled', 'rejected'];

const AdminCollaborations = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await api.get('/admin/campaigns', { params });
      setCampaigns(data.campaigns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <>
      <PageHeader title="Collaborations" subtitle="View all platform collaborations" />

      <ToolbarRow>
        <Filters>
          {STATUSES.map((s) => (
            <FilterBtn
              key={s}
              $variant={statusFilter === s ? 'primary' : 'ghost'}
              $size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === '' ? 'All' : STATUS_LABEL[s]}
            </FilterBtn>
          ))}
        </Filters>
        <SearchInput
          type="text"
          placeholder="Search by title, hotel, or influencer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </ToolbarRow>

      <Card $padding="0">
        <Table>
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Hotel</Th>
              <Th>Influencer</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c._id}>
                <Td>{c.title}</Td>
                <Td>{c.hotelId?.name || 'N/A'}</Td>
                <Td>{c.influencerDisplayName || c.influencerId?.name || 'N/A'}</Td>
                <Td>
                  <TypeLabel>{TYPE_LABEL[c.campaignType] || c.campaignType}</TypeLabel>
                </Td>
                <Td>
                  <Badge $variant={STATUS_VARIANT[c.status]}>
                    {STATUS_LABEL[c.status] || c.status}
                  </Badge>
                </Td>
                <Td>{new Date(c.createdAt).toLocaleDateString()}</Td>
                <Td>
                  <Button
                    $variant="ghost"
                    $size="sm"
                    onClick={() => navigate(`/admin/collaborations/${c._id}`)}
                  >
                    View
                  </Button>
                </Td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <Td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  {loading ? 'Loading...' : 'No collaborations found'}
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </>
  );
};

export default AdminCollaborations;
