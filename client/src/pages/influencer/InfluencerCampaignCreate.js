import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import CampaignForm from '../../components/campaigns/CampaignForm';

const InfluencerCampaignCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const preSelectedHotel = location.state?.preSelectedHotel || null;

  return (
    <>
      <PageHeader title="Create Campaign" subtitle="Propose a new collaboration with a hotel" />
      <CampaignForm
        preSelectedHotel={preSelectedHotel}
        onSuccess={() => navigate('/influencer/campaigns')}
        onCancel={() => navigate('/influencer/campaigns')}
      />
    </>
  );
};

export default InfluencerCampaignCreate;
