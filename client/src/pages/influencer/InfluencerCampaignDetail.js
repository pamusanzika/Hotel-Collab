import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import CampaignDetail from '../../components/campaigns/CampaignDetail';

const InfluencerCampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Campaign Details" subtitle="View and manage this campaign" />
      <Button
        $variant="ghost"
        $size="sm"
        onClick={() => navigate('/influencer/campaigns')}
        style={{ marginBottom: '1rem' }}
      >
        Back to Campaigns
      </Button>
      <CampaignDetail campaignId={id} />
    </>
  );
};

export default InfluencerCampaignDetail;
