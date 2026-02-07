import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../components/landing/Header';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { InputWrapper, Label, ErrorText } from '../components/ui/Input';
import api from '../api/axios';

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

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
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
      await api.post('/auth/reset-password', {
        token,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed');
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
              <Subtitle>This password reset link is invalid or missing a token.</Subtitle>
              <Button $variant="ghost" $fullWidth onClick={() => navigate('/forgot-password')}>
                Request a New Link
              </Button>
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
              <Title>Password Reset!</Title>
              <SuccessText>Your password has been updated successfully.</SuccessText>
              <Button $variant="primary" $fullWidth onClick={() => navigate('/login')}>
                Go to Login
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
            <Title>Reset Password</Title>
            <Subtitle>Enter your new password below.</Subtitle>
            <Form onSubmit={onSubmit}>
              <InputWrapper>
                <Label>New Password</Label>
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
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </Form>
          </Card>
        </FormWrapper>
      </Container>
    </>
  );
};

export default ResetPassword;
