import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../api/axios';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Value = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`;

const ApplicantRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  &:last-child { border-bottom: none; }
`;

const ApplicantInfo = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const BanSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.accent};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  resize: vertical;
  min-height: 80px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const STATUS_VARIANT = { open: 'active', closed: 'pending', banned: 'banned' };

const EVENT_LABEL = {
  grand_opening: 'Grand Opening', seasonal_event: 'Seasonal Event', festival: 'Festival',
  product_launch: 'Product Launch', anniversary: 'Anniversary', holiday_special: 'Holiday Special',
  food_wine: 'Food & Wine', wellness_retreat: 'Wellness Retreat', other: 'Other',
};

const COMP_LABEL = {
  free_stay: 'Free Stay', paid: 'Paid', commission: 'Commission',
  discount_stay: 'Discount Stay', mixed: 'Mixed',
};

const APPLICANT_VARIANT = { pending: 'pending', accepted: 'active', rejected: 'banned' };

const AdminOpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banReason, setBanReason] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/admin/opportunities/${id}`);
        setOpp(data.opportunity);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBan = async () => {
    setActing(true);
    try {
      await api.post(`/admin/opportunities/${id}/ban`, { reason: banReason });
      setOpp((prev) => ({ ...prev, status: 'banned', banReason }));
      setBanReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setActing(false);
    }
  };

  const handleUnban = async () => {
    setActing(true);
    try {
      await api.post(`/admin/opportunities/${id}/unban`);
      setOpp((prev) => ({ ...prev, status: 'open', banReason: '' }));
    } catch (err) {
      console.error(err);
    } finally {
      setActing(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!opp) return <p>Opportunity not found</p>;

  return (
    <>
      <PageHeader
        title={opp.title}
        subtitle={`Posted by ${opp.createdBy?.name || 'Unknown'}`}
      />

      <Grid>
        <div>
          <Card>
            <Section>
              <Label>Description</Label>
              <Value>{opp.description || 'No description provided'}</Value>

              <Label>Event Type</Label>
              <Value>{EVENT_LABEL[opp.eventType] || opp.eventType}</Value>

              <Label>Compensation</Label>
              <Value>
                {COMP_LABEL[opp.compensationType] || opp.compensationType}
                {opp.compensationDetails && ` — ${opp.compensationDetails}`}
              </Value>

              <Label>Event Dates</Label>
              <Value>
                {new Date(opp.eventStartDate).toLocaleDateString()} — {new Date(opp.eventEndDate).toLocaleDateString()}
              </Value>

              <Label>Application Deadline</Label>
              <Value>{new Date(opp.applicationDeadline).toLocaleDateString()}</Value>

              <Label>Max Applicants</Label>
              <Value>{opp.maxApplicants}</Value>
            </Section>

            {opp.requirements && (
              <Section>
                <Label>Requirements</Label>
                {opp.requirements.minFollowers > 0 && (
                  <Value>Min Followers: {opp.requirements.minFollowers.toLocaleString()}</Value>
                )}
                {opp.requirements.niches?.length > 0 && (
                  <Value>Niches: {opp.requirements.niches.join(', ')}</Value>
                )}
                {opp.requirements.deliverables && (
                  <Value>Deliverables: {opp.requirements.deliverables}</Value>
                )}
              </Section>
            )}
          </Card>

          <Card style={{ marginTop: '1rem' }}>
            <Label>Applicants ({opp.applicants?.length || 0})</Label>
            {opp.applicants?.length > 0 ? (
              opp.applicants.map((a) => (
                <ApplicantRow key={a._id}>
                  <ApplicantInfo>
                    <strong>{a.influencerProfile?.displayName || a.userId?.name || 'Unknown'}</strong>
                    <br />
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>
                      {a.userId?.email} {a.influencerProfile?.niche && `· ${a.influencerProfile.niche}`}
                    </span>
                    {a.message && <p style={{ fontSize: '0.8rem', margin: '4px 0 0' }}>{a.message}</p>}
                  </ApplicantInfo>
                  <Badge $variant={APPLICANT_VARIANT[a.status]}>{a.status}</Badge>
                </ApplicantRow>
              ))
            ) : (
              <Value>No applicants yet</Value>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <Label>Hotel</Label>
            <Value>{opp.hotelId?.name || 'N/A'} — {opp.hotelId?.city || ''}</Value>

            <Label>Status</Label>
            <Badge $variant={STATUS_VARIANT[opp.status]} style={{ marginBottom: '1rem' }}>
              {opp.status}
            </Badge>

            <Label style={{ marginTop: '1rem' }}>Created</Label>
            <Value>{new Date(opp.createdAt).toLocaleDateString()}</Value>

            {opp.status === 'banned' && opp.banReason && (
              <>
                <Label>Ban Reason</Label>
                <Value style={{ color: '#DC2626' }}>{opp.banReason}</Value>
              </>
            )}
          </Card>

          <BanSection>
            {opp.status === 'banned' ? (
              <>
                <Label>This opportunity is banned</Label>
                <ButtonRow>
                  <Button $variant="primary" $size="sm" onClick={handleUnban} disabled={acting}>
                    {acting ? 'Processing...' : 'Unban Opportunity'}
                  </Button>
                </ButtonRow>
              </>
            ) : (
              <>
                <Label>Ban this opportunity</Label>
                <TextArea
                  placeholder="Reason for banning..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                />
                <ButtonRow>
                  <Button $variant="danger" $size="sm" onClick={handleBan} disabled={acting}>
                    {acting ? 'Banning...' : 'Ban Opportunity'}
                  </Button>
                </ButtonRow>
              </>
            )}
          </BanSection>

          <ButtonRow style={{ marginTop: '1rem' }}>
            <Button $variant="ghost" $size="sm" onClick={() => navigate('/admin/opportunities')}>
              Back to List
            </Button>
          </ButtonRow>
        </div>
      </Grid>
    </>
  );
};

export default AdminOpportunityDetail;
