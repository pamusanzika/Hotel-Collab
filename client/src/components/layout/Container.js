import styled from 'styled-components';

const Container = styled.div`
  width: 100%;
  max-width: ${({ $maxWidth }) => $maxWidth || '1200px'};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg};
`;

export default Container;
