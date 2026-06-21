import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const OppTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
`;

const OppMeta = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`;

const OppDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TagRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled(Card)`
  width: 90%;
  max-width: 480px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  resize: vertical;
  min-height: 80px;
  outline: none;
  margin: ${({ theme }) => theme.spacing.sm} 0;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const EVENT_LABEL = {
  grand_opening: 'Grand Opening', seasonal_event: 'Seasonal Event', festival: 'Festival',
  product_launch: 'Product Launch', anniversary: 'Anniversary', holiday_special: 'Holiday Special',
  food_wine: 'Food & Wine', wellness_retreat: 'Wellness Retreat', other: 'Other',
};

const COMP_LABEL = {
  free_stay: 'Free Stay', paid: 'Paid', commission: 'Commission',
  discount_stay: 'Discount Stay', mixed: 'Mixed',
};

const EVENT_TYPES = ['', 'grand_opening', 'seasonal_event', 'festival', 'product_launch', 'anniversary', 'holiday_special', 'food_wine', 'wellness_retreat', 'other'];

const BrowseOpportunities = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [eventFilter, setEventFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [applyingTo, setApplyingTo] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (eventFilter) params.eventType = eventFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await api.get('/opportunities/browse', { params });
      setOpportunities(data.opportunities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [eventFilter, debouncedSearch]);

  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

  const handleApply = async () => {
    setSubmitting(true);
    try {
      await api.post(`/opportunities/${applyingTo}/apply`, { message: applyMessage });
      setOpportunities((prev) =>
        prev.map((o) =>
          o._id === applyingTo
            ? { ...o, applicants: [...(o.applicants || []), { userId: user._id, status: 'pending' }] }
            : o
        )
      );
      setApplyingTo(null);
      setApplyMessage('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to apply');
    } finally {
      setSubmitting(false);
    }
  };

  const hasApplied = (opp) => opp.applicants?.some((a) => String(a.userId?._id || a.userId) === String(user?._id));

  return (
    <>
      <PageHeader title="Event Opportunities" subtitle="Browse collaboration opportunities from hotels" />

      <ToolbarRow>
        <Filters>
          {['', 'seasonal_event', 'festival', 'holiday_special', 'food_wine', 'wellness_retreat'].map((s) => (
            <FilterBtn
              key={s}
              $variant={eventFilter === s ? 'primary' : 'ghost'}
              $size="sm"
              onClick={() => setEventFilter(s)}
            >
              {s === '' ? 'All' : EVENT_LABEL[s]}
            </FilterBtn>
          ))}
        </Filters>
        <SearchInput
          type="text"
          placeholder="Search opportunities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </ToolbarRow>

      {loading ? (
        <EmptyState>Loading...</EmptyState>
      ) : opportunities.length === 0 ? (
        <Card><EmptyState>No opportunities available right now. Check back later!</EmptyState></Card>
      ) : (
        <Grid>
          {opportunities.map((o) => (
            <Card key={o._id} style={{ padding: 0, overflow: 'hidden' }}>
              {o.images?.length > 0 && (
                <img
                  src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001'}${o.images[0]}`}
                  alt={o.title}
                  style={{ width: '100%', height: 180, objectFit: 'cover' }}
                />
              )}
              <div style={{ padding: '1rem' }}>
              <OppTitle>{o.title}</OppTitle>
              <OppMeta>
                {o.hotelId?.name} {o.hotelId?.city && `· ${o.hotelId.city}`} · Deadline: {new Date(o.applicationDeadline).toLocaleDateString()}
              </OppMeta>
              <OppDesc>{o.description}</OppDesc>
              <TagRow>
                <Badge $variant="info">{EVENT_LABEL[o.eventType] || o.eventType}</Badge>
                <Badge $variant="active">{COMP_LABEL[o.compensationType] || o.compensationType}</Badge>
                {o.requirements?.minFollowers > 0 && (
                  <Badge $variant="pending">{o.requirements.minFollowers.toLocaleString()}+ followers</Badge>
                )}
              </TagRow>
              <OppMeta>
                Event: {new Date(o.eventStartDate).toLocaleDateString()} — {new Date(o.eventEndDate).toLocaleDateString()}
              </OppMeta>
              <CardFooter>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>
                  {o.applicants?.length || 0} applicant(s)
                </span>
                {hasApplied(o) ? (
                  <Badge $variant="pending">Applied</Badge>
                ) : (
                  <Button $size="sm" onClick={() => setApplyingTo(o._id)}>Apply</Button>
                )}
              </CardFooter>
              </div>
            </Card>
          ))}
        </Grid>
      )}

      {applyingTo && (
        <ModalOverlay onClick={() => setApplyingTo(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.5rem' }}>Apply to Opportunity</h3>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>Add an optional message to your application</p>
            <TextArea
              placeholder="Why are you a good fit for this event?"
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              maxLength={500}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button $variant="ghost" $size="sm" onClick={() => { setApplyingTo(null); setApplyMessage(''); }}>Cancel</Button>
              <Button $size="sm" onClick={handleApply} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</Button>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default BrowseOpportunities;
