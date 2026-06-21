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
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textSecondary}; }
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

const STATUS_VARIANT = { open: 'active', closed: 'pending', banned: 'banned' };
const STATUS_LABEL = { open: 'Open', closed: 'Closed', banned: 'Banned' };

const EVENT_LABEL = {
  grand_opening: 'Grand Opening', seasonal_event: 'Seasonal Event', festival: 'Festival',
  product_launch: 'Product Launch', anniversary: 'Anniversary', holiday_special: 'Holiday Special',
  food_wine: 'Food & Wine', wellness_retreat: 'Wellness Retreat', other: 'Other',
};

const COMP_LABEL = {
  free_stay: 'Free Stay', paid: 'Paid', commission: 'Commission',
  discount_stay: 'Discount Stay', mixed: 'Mixed',
};

const STATUSES = ['', 'open', 'closed', 'banned'];

const AdminOpportunities = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await api.get('/admin/opportunities', { params });
      setOpportunities(data.opportunities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

  return (
    <>
      <PageHeader title="Collab Opportunities" subtitle="View and moderate event collaboration listings" />

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
          placeholder="Search by title or description..."
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
              <Th>Event Type</Th>
              <Th>Compensation</Th>
              <Th>Deadline</Th>
              <Th>Applicants</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr key={o._id}>
                <Td>{o.title}</Td>
                <Td>{o.hotelId?.name || 'N/A'}</Td>
                <Td><TypeLabel>{EVENT_LABEL[o.eventType] || o.eventType}</TypeLabel></Td>
                <Td><TypeLabel>{COMP_LABEL[o.compensationType] || o.compensationType}</TypeLabel></Td>
                <Td>{new Date(o.applicationDeadline).toLocaleDateString()}</Td>
                <Td>{o.applicants?.length || 0}</Td>
                <Td>
                  <Badge $variant={STATUS_VARIANT[o.status]}>
                    {STATUS_LABEL[o.status] || o.status}
                  </Badge>
                </Td>
                <Td>
                  <Button
                    $variant="ghost"
                    $size="sm"
                    onClick={() => navigate(`/admin/opportunities/${o._id}`)}
                  >
                    View
                  </Button>
                </Td>
              </tr>
            ))}
            {opportunities.length === 0 && (
              <tr>
                <Td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  {loading ? 'Loading...' : 'No opportunities found'}
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </>
  );
};

export default AdminOpportunities;
