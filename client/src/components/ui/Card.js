import styled from 'styled-components';

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: ${({ $padding, theme }) => $padding || theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export default Card;
