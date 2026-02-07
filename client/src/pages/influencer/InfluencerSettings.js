import React from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { InputWrapper, Label } from '../../components/ui/Input';
import styled from 'styled-components';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: 400px;
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const InfluencerSettings = () => (
  <>
    <PageHeader title="Settings" subtitle="Account preferences" />
    <Section>
      <SectionTitle>Change Password</SectionTitle>
      <Card>
        <Form>
          <InputWrapper>
            <Label>Current Password</Label>
            <Input type="password" placeholder="Current password" />
          </InputWrapper>
          <InputWrapper>
            <Label>New Password</Label>
            <Input type="password" placeholder="New password" />
          </InputWrapper>
          <Button $variant="secondary" style={{ alignSelf: 'flex-start' }}>
            Update Password
          </Button>
        </Form>
      </Card>
    </Section>
    <Section>
      <SectionTitle>Danger Zone</SectionTitle>
      <Card>
        <Button $variant="danger">Delete Account</Button>
      </Card>
    </Section>
  </>
);

export default InfluencerSettings;
