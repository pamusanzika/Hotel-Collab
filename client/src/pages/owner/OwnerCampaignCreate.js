import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import CampaignForm from '../../components/campaigns/CampaignForm';

const OwnerCampaignCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const preSelectedInfluencer = location.state?.preSelectedInfluencer || null;

  return (
    <>
      <PageHeader title="Create Campaign" subtitle="Propose a new collaboration with an influencer" />
      <CampaignForm
        preSelectedInfluencer={preSelectedInfluencer}
        onSuccess={() => navigate('/owner/collaborations')}
        onCancel={() => navigate('/owner/collaborations')}
      />
    </>
  );
};

export default OwnerCampaignCreate;
