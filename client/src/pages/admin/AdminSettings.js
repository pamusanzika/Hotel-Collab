import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input, { InputWrapper, Label, ErrorText } from '../../components/ui/Input';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Form = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: flex-end;
  max-width: 500px;
`;

const SuccessText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.success};
  margin-top: ${({ theme }) => theme.spacing.sm};
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

const AdminSettings = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState([]);
  const [admins, setAdmins] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [invitesRes, adminsRes] = await Promise.all([
        api.get('/admin/invites'),
        api.get('/admin/admins'),
      ]);
      setInvites(invitesRes.data.invites);
      setAdmins(adminsRes.data.admins);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post('/admin/invite', { email });
      setSuccess(data.message);
      setEmail('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (inviteEmail) => {
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/admin/invite', { email: inviteEmail });
      setSuccess(data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend invitation');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this admin?')) return;
    setError('');
    setSuccess('');
    try {
      const { data } = await api.delete(`/admin/admins/${id}`);
      setSuccess(data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove admin');
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage admins and invitations" />

      <Section>
        <SectionTitle>Invite New Admin</SectionTitle>
        <Card>
          <Form onSubmit={onSubmit}>
            <InputWrapper style={{ flex: 1 }}>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="newadmin@example.com"
                required
              />
            </InputWrapper>
            <Button $variant="primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </Form>
          {success && <SuccessText>{success}</SuccessText>}
          {error && <ErrorText>{error}</ErrorText>}
        </Card>
      </Section>

      <Section>
        <SectionTitle>All Admins</SectionTitle>
        <Card $padding="0">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Joined</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <Td>{admin.name}</Td>
                  <Td>{admin.email}</Td>
                  <Td>{new Date(admin.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    {admin._id === user?.id ? (
                      <Badge $variant="active">You</Badge>
                    ) : (
                      <Button $variant="danger" $size="sm" onClick={() => handleRemove(admin._id)}>
                        Remove
                      </Button>
                    )}
                  </Td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <Td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    No admins found
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      </Section>

      <Section>
        <SectionTitle>Pending Invitations</SectionTitle>
        <Card $padding="0">
          <Table>
            <thead>
              <tr>
                <Th>Email</Th>
                <Th>Invited By</Th>
                <Th>Invited</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv._id}>
                  <Td>{inv.email}</Td>
                  <Td>{inv.invitedBy?.name || 'Unknown'}</Td>
                  <Td>{new Date(inv.invitedAt).toLocaleDateString()}</Td>
                  <Td>
                    <Badge $variant={inv.expired ? 'banned' : 'pending'}>
                      {inv.expired ? 'Expired' : 'Pending'}
                    </Badge>
                  </Td>
                  <Td>
                    {inv.expired && (
                      <Button $variant="ghost" $size="sm" onClick={() => handleResend(inv.email)}>
                        Resend
                      </Button>
                    )}
                  </Td>
                </tr>
              ))}
              {invites.length === 0 && (
                <tr>
                  <Td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    No pending invitations
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      </Section>
    </>
  );
};

export default AdminSettings;
