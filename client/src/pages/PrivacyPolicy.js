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

const SubTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
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

const PrivacyPolicy = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
  <>
    <Header />
    <Container>
      <PageWrapper>
        <Title>Privacy Policy</Title>
        <EffectiveDate>Effective Date: 11 February 2026 | Location: Sri Lanka</EffectiveDate>

        <Section>
          <SectionTitle>1. Introduction</SectionTitle>
          <Paragraph>
            Welcome to Influspark. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.
          </Paragraph>
          <Paragraph>
            By accessing or using Influspark, you agree to the practices described in this policy.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>2. Information We Collect</SectionTitle>
          <Paragraph>We may collect the following types of information:</Paragraph>

          <SubTitle>a) Personal Information</SubTitle>
          <Paragraph>When you register or use our services, we may collect:</Paragraph>
          <List>
            <li>Name</li>
            <li>Email address</li>
            <li>Profile details</li>
            <li>Social media information (for content creators)</li>
            <li>Hotel information (for hotel owners)</li>
            <li>Contact details</li>
            <li>Uploaded images and content</li>
          </List>

          <SubTitle>b) Usage Information</SubTitle>
          <Paragraph>We automatically collect:</Paragraph>
          <List>
            <li>IP address</li>
            <li>Device information</li>
            <li>Browser type</li>
            <li>Pages visited</li>
            <li>Time spent on the platform</li>
          </List>

          <SubTitle>c) Communication Data</SubTitle>
          <Paragraph>Any messages or communication exchanged through the Influspark platform.</Paragraph>
        </Section>

        <Section>
          <SectionTitle>3. How We Use Your Information</SectionTitle>
          <Paragraph>We use your data to:</Paragraph>
          <List>
            <li>Provide and improve our services</li>
            <li>Enable communication between hotels and content creators</li>
            <li>Manage user accounts</li>
            <li>Personalize your experience</li>
            <li>Send notifications and updates</li>
            <li>Ensure platform security</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>4. Data Sharing</SectionTitle>
          <Paragraph>Influspark does not sell your personal data.</Paragraph>
          <Paragraph>We may share your information only with:</Paragraph>
          <List>
            <li>Other users you choose to interact with</li>
            <li>Trusted service providers that help operate the platform</li>
            <li>Legal authorities when required by Sri Lankan law</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>5. Data Security</SectionTitle>
          <Paragraph>
            We take reasonable measures to protect your personal data from unauthorized access, loss, or misuse.
          </Paragraph>
          <Paragraph>However, no online platform can guarantee complete security.</Paragraph>
        </Section>

        <Section>
          <SectionTitle>6. Your Rights</SectionTitle>
          <Paragraph>You have the right to:</Paragraph>
          <List>
            <li>Access your personal data</li>
            <li>Update or correct your information</li>
            <li>Request deletion of your account</li>
            <li>Opt out of marketing communications</li>
          </List>
          <Paragraph>
            To exercise these rights, contact us at: <EmailLink href="mailto:support@influspark.com">support@influspark.com</EmailLink>
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>7. Cookies</SectionTitle>
          <Paragraph>Influspark uses cookies to:</Paragraph>
          <List>
            <li>Improve user experience</li>
            <li>Analyze platform performance</li>
            <li>Remember user preferences</li>
          </List>
          <Paragraph>You can disable cookies through your browser settings.</Paragraph>
        </Section>

        <Section>
          <SectionTitle>8. Third-Party Links</SectionTitle>
          <Paragraph>
            Our platform may contain links to external websites. We are not responsible for the privacy practices of those websites.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>9. Changes to This Policy</SectionTitle>
          <Paragraph>
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>10. Contact Us</SectionTitle>
          <Paragraph>If you have any questions about this Privacy Policy, contact:</Paragraph>
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

export default PrivacyPolicy;
