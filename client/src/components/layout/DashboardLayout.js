import React from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const LayoutWrapper = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainArea = styled.div`
  flex: 1;
  margin-left: ${({ theme }) => theme.sidebar.width};
  display: flex;
  flex-direction: column;
`;

const Content = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const DashboardLayout = ({ logoText, navItems }) => (
  <LayoutWrapper>
    <Sidebar logoText={logoText} items={navItems} />
    <MainArea>
      <Topbar />
      <Content>
        <Outlet />
      </Content>
    </MainArea>
  </LayoutWrapper>
);

export default DashboardLayout;
