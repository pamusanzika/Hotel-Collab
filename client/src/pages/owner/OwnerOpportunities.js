import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../api/axios';

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const OpportunityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const OppCard = styled(Card)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

const OppInfo = styled.div`
  flex: 1;
  min-width: 200px;
`;

const OppTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
`;

const OppMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const STATUS_VARIANT = { open: 'active', closed: 'pending', banned: 'banned' };

const EVENT_LABEL = {
  grand_opening: 'Grand Opening', seasonal_event: 'Seasonal Event', festival: 'Festival',
  product_launch: 'Product Launch', anniversary: 'Anniversary', holiday_special: 'Holiday Special',
  food_wine: 'Food & Wine', wellness_retreat: 'Wellness Retreat', other: 'Other',
};

const OwnerOpportunities = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/opportunities');
      setOpportunities(data.opportunities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <HeaderRow>
        <PageHeader title="Event Opportunities" subtitle="Publish collaboration opportunities for your upcoming events" />
        <Button onClick={() => navigate('/owner/opportunities/create')}>Create Opportunity</Button>
      </HeaderRow>

      {loading ? (
        <EmptyState>Loading...</EmptyState>
      ) : opportunities.length === 0 ? (
        <Card>
          <EmptyState>
            No opportunities yet. Create one to attract content creators to your upcoming events.
          </EmptyState>
        </Card>
      ) : (
        <OpportunityList>
          {opportunities.map((o) => (
            <OppCard key={o._id}>
              <OppInfo>
                <OppTitle>{o.title}</OppTitle>
                <OppMeta>
                  {o.hotelId?.name} &middot; {EVENT_LABEL[o.eventType] || o.eventType} &middot;{' '}
                  Deadline: {new Date(o.applicationDeadline).toLocaleDateString()} &middot;{' '}
                  {o.applicants?.length || 0} applicant(s)
                </OppMeta>
              </OppInfo>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Badge $variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
                <Button $variant="ghost" $size="sm" onClick={() => navigate(`/owner/opportunities/${o._id}`)}>
                  View
                </Button>
              </div>
            </OppCard>
          ))}
        </OpportunityList>
      )}
    </>
  );
};

export default OwnerOpportunities;
