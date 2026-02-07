import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/landing/Header';
import Container from '../../components/layout/Container';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { InputWrapper, Label, ErrorText } from '../../components/ui/Input';
import api from '../../api/axios';

const FormWrapper = styled.div`
  max-width: 400px;
  margin: ${({ theme }) => theme.spacing['2xl']} auto;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SuccessText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.success};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const AdminSetupPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/setup-password', {
        token,
        name: form.name,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Account setup failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <>
        <Header />
        <Container>
          <FormWrapper>
            <Card>
              <Title>Invalid Link</Title>
              <Subtitle>This invitation link is invalid or missing a token.</Subtitle>
            </Card>
          </FormWrapper>
        </Container>
      </>
    );
  }

  if (success) {
    return (
      <>
        <Header />
        <Container>
          <FormWrapper>
            <Card>
              <Title>Account Ready!</Title>
              <SuccessText>Your admin account has been set up successfully.</SuccessText>
              <Button $variant="primary" $fullWidth onClick={() => navigate('/admin')}>
                Go to Admin Login
              </Button>
            </Card>
          </FormWrapper>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container>
        <FormWrapper>
          <Card>
            <Title>Set Up Your Admin Account</Title>
            <Subtitle>Enter your name and choose a password.</Subtitle>
            <Form onSubmit={onSubmit}>
              <InputWrapper>
                <Label>Your Name</Label>
                <Input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Full name"
                  required
                />
              </InputWrapper>
              <InputWrapper>
                <Label>Password</Label>
                <Input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="At least 8 characters"
                  required
                />
              </InputWrapper>
              <InputWrapper>
                <Label>Confirm Password</Label>
                <Input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={onChange}
                  placeholder="Re-enter your password"
                  required
                />
              </InputWrapper>
              {error && <ErrorText>{error}</ErrorText>}
              <Button $variant="primary" $fullWidth disabled={loading}>
                {loading ? 'Setting up...' : 'Set Up Account'}
              </Button>
            </Form>
          </Card>
        </FormWrapper>
      </Container>
    </>
  );
};

export default AdminSetupPassword;
