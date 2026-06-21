import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import Header from '../components/landing/Header';
import Container from '../components/layout/Container';

const PageWrapper = styled.div`
  padding-top: 120px;
  padding-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const EffectiveDate = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Paragraph = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const List = styled.ul`
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  padding-left: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  li {
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }
`;

const EmailLink = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Footer = styled.footer`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const FooterLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const TermsConditions = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
  <>
    <Header />
    <Container>
      <PageWrapper>
        <Title>Terms and Conditions</Title>
        <EffectiveDate>Effective Date: 11 February 2026 | Jurisdiction: Sri Lanka</EffectiveDate>

        <Paragraph>
          Welcome to Influspark. These Terms and Conditions govern your use of our platform. By using Influspark, you agree to the following terms.
        </Paragraph>

        <Section>
          <SectionTitle>1. Acceptance of Terms</SectionTitle>
          <Paragraph>
            By accessing or using Influspark, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the platform.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>2. Platform Purpose</SectionTitle>
          <Paragraph>Influspark is a collaboration platform that connects:</Paragraph>
          <List>
            <li>Hotel Owners</li>
            <li>Travel Content Creators</li>
          </List>
          <Paragraph>for partnership and marketing collaborations.</Paragraph>
        </Section>

        <Section>
          <SectionTitle>3. User Accounts</SectionTitle>
          <Paragraph>To use Influspark, you must:</Paragraph>
          <List>
            <li>Create an account</li>
            <li>Provide accurate information</li>
            <li>Keep your login details secure</li>
          </List>
          <Paragraph>You are responsible for all activity under your account.</Paragraph>
        </Section>

        <Section>
          <SectionTitle>4. User Responsibilities</SectionTitle>
          <Paragraph>Users agree to:</Paragraph>
          <List>
            <li>Use the platform honestly and lawfully</li>
            <li>Provide accurate information</li>
            <li>Respect other users</li>
            <li>Not post false or misleading content</li>
            <li>Not misuse the messaging system</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>5. Collaboration Agreements</SectionTitle>
          <Paragraph>Influspark only provides the platform for connection.</Paragraph>
          <Paragraph>Any agreements between hotels and content creators are:</Paragraph>
          <List>
            <li>Made directly between the two parties</li>
            <li>Not guaranteed by Influspark</li>
            <li>Their own responsibility</li>
          </List>
          <Paragraph>Influspark is not liable for disputes between users.</Paragraph>
        </Section>

        <Section>
          <SectionTitle>6. Prohibited Activities</SectionTitle>
          <Paragraph>Users must not:</Paragraph>
          <List>
            <li>Use fake profiles</li>
            <li>Harass other users</li>
            <li>Post illegal or inappropriate content</li>
            <li>Attempt to hack or disrupt the platform</li>
            <li>Use Influspark for spam or scams</li>
          </List>
          <Paragraph>Violation may result in account suspension or termination.</Paragraph>
        </Section>

        <Section>
          <SectionTitle>7. Content Ownership</SectionTitle>
          <Paragraph>Users retain ownership of the content they upload.</Paragraph>
          <Paragraph>By posting on Influspark, you grant us permission to:</Paragraph>
          <List>
            <li>Display</li>
            <li>Store</li>
            <li>Share your content within the platform</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>8. Payments (If Applicable)</SectionTitle>
          <Paragraph>If Influspark introduces paid services:</Paragraph>
          <List>
            <li>All payments must follow the stated terms</li>
            <li>Refunds are subject to platform policies</li>
            <li>Prices may change at any time</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>9. Limitation of Liability</SectionTitle>
          <Paragraph>Influspark is provided "as is."</Paragraph>
          <Paragraph>We are not responsible for:</Paragraph>
          <List>
            <li>Failed collaborations</li>
            <li>User disputes</li>
            <li>Loss of data</li>
            <li>Business losses</li>
          </List>
          <Paragraph>Use the platform at your own risk.</Paragraph>
        </Section>

        <Section>
          <SectionTitle>10. Account Termination</SectionTitle>
          <Paragraph>
            We reserve the right to suspend, ban, or terminate any account that violates these terms.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>11. Modifications</SectionTitle>
          <Paragraph>
            Influspark may update these Terms at any time. Continued use of the platform means you accept the updated terms.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>12. Governing Law</SectionTitle>
          <Paragraph>These Terms and Conditions are governed by the laws of Sri Lanka.</Paragraph>
        </Section>

        <Section>
          <SectionTitle>13. Contact Information</SectionTitle>
          <Paragraph>For any questions about these Terms:</Paragraph>
          <Paragraph>
            Influspark Support – Sri Lanka<br />
            <EmailLink href="mailto:support@influspark.com">support@influspark.com</EmailLink>
          </Paragraph>
        </Section>
      </PageWrapper>
    </Container>
    <Footer>
      <FooterLinks>
        <FooterLink to="/privacy-policy">Privacy Policy</FooterLink>
        <FooterLink to="/terms-conditions">Terms &amp; Conditions</FooterLink>
      </FooterLinks>
      &copy; {new Date().getFullYear()} Influspark. All rights reserved.
    </Footer>
  </>
  );
};

export default TermsConditions;
