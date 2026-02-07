import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../components/landing/Header';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../api/axios';

const Wrapper = styled.div`
  max-width: 440px;
  margin: ${({ theme }) => theme.spacing['2xl']} auto;
  text-align: center;
`;

const Message = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.primary};
`;

const Sub = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  return (
    <>
      <Header />
      <Container>
        <Wrapper>
          <Card $padding="2.5rem">
            {status === 'verifying' && <Message>Verifying your email...</Message>}
            {status === 'success' && (
              <>
                <Message>Email Verified!</Message>
                <Sub>Your account is now active. You can log in.</Sub>
                <Button $variant="primary" onClick={() => navigate('/login')}>
                  Go to Login
                </Button>
              </>
            )}
            {status === 'error' && (
              <>
                <Message $error>Verification Failed</Message>
                <Sub>The link may be invalid or expired.</Sub>
                <Button $variant="ghost" onClick={() => navigate('/apply')}>
                  Try Again
                </Button>
              </>
            )}
          </Card>
        </Wrapper>
      </Container>
    </>
  );
};

export default VerifyEmail;
