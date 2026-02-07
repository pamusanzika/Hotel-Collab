import styled, { css } from 'styled-components';

const badgeVariants = {
  active: css`
    background: ${({ theme }) => theme.colors.primary}15;
    color: ${({ theme }) => theme.colors.primaryDark};
  `,
  banned: css`
    background: ${({ theme }) => theme.colors.accent}15;
    color: ${({ theme }) => theme.colors.accentDark};
  `,
  pending: css`
    background: ${({ theme }) => theme.colors.warning}15;
    color: #B45309;
  `,
  info: css`
    background: ${({ theme }) => theme.colors.secondary}15;
    color: ${({ theme }) => theme.colors.secondaryDark};
  `,
};

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.full};
  text-transform: capitalize;
  white-space: nowrap;

  ${({ $variant = 'active' }) => badgeVariants[$variant]}
`;

export default Badge;
