import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import theme from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { useSocket } from './hooks/useSocket';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './utils/guards';
import DashboardLayout from './components/layout/DashboardLayout';
import api from './api/axios';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Apply from './pages/Apply';
import ApplyHotelOwner from './pages/ApplyHotelOwner';
import ApplyInfluencer from './pages/ApplyInfluencer';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerProfile from './pages/owner/OwnerProfile';
import OwnerHotels from './pages/owner/OwnerHotels';
import AddHotelListing from './pages/owner/AddHotelListing';
import EditHotelListing from './pages/owner/EditHotelListing';
import HotelPreview from './pages/owner/HotelPreview';
import OwnerCollaborations from './pages/owner/OwnerCollaborations';
import OwnerCampaignCreate from './pages/owner/OwnerCampaignCreate';
import OwnerCampaignDetail from './pages/owner/OwnerCampaignDetail';
import OwnerSettings from './pages/owner/OwnerSettings';
import InfluencersListing from './pages/owner/InfluencersListing';
import InfluencerProfileView from './pages/owner/InfluencerProfileView';
import OwnerOpportunities from './pages/owner/OwnerOpportunities';
import OwnerOpportunityCreate from './pages/owner/OwnerOpportunityCreate';
import OwnerOpportunityDetail from './pages/owner/OwnerOpportunityDetail';

// Influencer pages
import InfluencerDashboard from './pages/influencer/InfluencerDashboard';
import InfluencerProfile from './pages/influencer/InfluencerProfile';
import InfluencerCampaigns from './pages/influencer/InfluencerCampaigns';
import InfluencerSettings from './pages/influencer/InfluencerSettings';
import InfluencerCampaignCreate from './pages/influencer/InfluencerCampaignCreate';
import InfluencerCampaignDetail from './pages/influencer/InfluencerCampaignDetail';
import HostsListing from './pages/influencer/HostsListing';
import HostDetails from './pages/influencer/HostDetails';
import BrowseOpportunities from './pages/influencer/BrowseOpportunities';

// Shared pages
import Messages from './pages/shared/Messages';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCollaborations from './pages/admin/AdminCollaborations';
import AdminCollaborationDetail from './pages/admin/AdminCollaborationDetail';
import AdminSettings from './pages/admin/AdminSettings';
import AdminUserPreview from './pages/admin/AdminUserPreview';
import AdminSetupPassword from './pages/admin/AdminSetupPassword';
import AdminPayments from './pages/admin/AdminPayments';
import AdminOpportunities from './pages/admin/AdminOpportunities';
import AdminOpportunityDetail from './pages/admin/AdminOpportunityDetail';

// Nav configs
const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/collaborations', label: 'Collaborations' },
  { to: '/admin/opportunities', label: 'Opportunities' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/settings', label: 'Settings' },
];

// Hook to fetch pending campaign application count
const usePendingCampaigns = () => {
  const { user } = useAuth();
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    api.get('/campaigns/stats')
      .then(({ data }) => setCount(data.pendingApplications || 0))
      .catch(() => {});
  }, [user]);

  return count;
};

// Layout wrappers that inject dynamic unread badge
const OwnerLayout = () => {
  const { unreadCount } = useSocket();
  const pendingCampaigns = usePendingCampaigns();
  const navItems = [
    { to: '/owner', label: 'Dashboard', end: true },
    { to: '/owner/profile', label: 'Profile' },
    { to: '/owner/hotels', label: 'Hotels' },
    { to: '/owner/influencers', label: 'Content Creators' },
    { to: '/owner/messages', label: 'Messages', badge: unreadCount },
    { to: '/owner/collaborations', label: 'Collaborations', badge: pendingCampaigns },
    { to: '/owner/opportunities', label: 'Opportunities' },
    { to: '/owner/settings', label: 'Settings' },
  ];
  return <DashboardLayout logoSrc="/logo-3.svg" logoText="Influspark" navItems={navItems} />;
};

const InfluencerLayout = () => {
  const { unreadCount } = useSocket();
  const pendingCampaigns = usePendingCampaigns();
  const navItems = [
    { to: '/influencer', label: 'Dashboard', end: true },
    { to: '/influencer/profile', label: 'Profile' },
    { to: '/influencer/hosts', label: 'Hosts' },
    { to: '/influencer/messages', label: 'Messages', badge: unreadCount },
    { to: '/influencer/campaigns', label: 'Campaigns', badge: pendingCampaigns },
    { to: '/influencer/opportunities', label: 'Opportunities' },
    { to: '/influencer/settings', label: 'Settings' },
  ];
  return <DashboardLayout logoSrc="/logo-3.svg" logoText="Influspark" navItems={navItems} />;
};

const App = () => (
  <ThemeProvider theme={theme}>
    <GlobalStyles />
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/apply/hotel-owner" element={<ApplyHotelOwner />} />
            <Route path="/apply/influencer" element={<ApplyInfluencer />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/admin/setup-password" element={<AdminSetupPassword />} />

            {/* Hotel Owner Dashboard */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute role="hotel_owner">
                  <OwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OwnerDashboard />} />
              <Route path="profile" element={<OwnerProfile />} />
              <Route path="hotels" element={<OwnerHotels />} />
              <Route path="hotels/add" element={<AddHotelListing />} />
              <Route path="hotels/edit/:id" element={<EditHotelListing />} />
              <Route path="hotels/preview/:id" element={<HotelPreview />} />
              <Route path="influencers" element={<InfluencersListing />} />
              <Route path="influencers/:id" element={<InfluencerProfileView />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/:conversationId" element={<Messages />} />
              <Route path="collaborations" element={<OwnerCollaborations />} />
              <Route path="collaborations/create" element={<OwnerCampaignCreate />} />
              <Route path="collaborations/:id" element={<OwnerCampaignDetail />} />
              <Route path="opportunities" element={<OwnerOpportunities />} />
              <Route path="opportunities/create" element={<OwnerOpportunityCreate />} />
              <Route path="opportunities/:id" element={<OwnerOpportunityDetail />} />
              <Route path="settings" element={<OwnerSettings />} />
            </Route>

            {/* Influencer Dashboard */}
            <Route
              path="/influencer"
              element={
                <ProtectedRoute role="influencer">
                  <InfluencerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<InfluencerDashboard />} />
              <Route path="profile" element={<InfluencerProfile />} />
              <Route path="hosts" element={<HostsListing />} />
              <Route path="hosts/:id" element={<HostDetails />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/:conversationId" element={<Messages />} />
              <Route path="campaigns" element={<InfluencerCampaigns />} />
              <Route path="campaigns/create" element={<InfluencerCampaignCreate />} />
              <Route path="campaigns/:id" element={<InfluencerCampaignDetail />} />
              <Route path="opportunities" element={<BrowseOpportunities />} />
              <Route path="settings" element={<InfluencerSettings />} />
            </Route>

            {/* Admin — separate UI shell */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <DashboardLayout logoSrc="/logo-3.svg" logoText="Admin Panel" navItems={adminNav} />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUserPreview />} />
              <Route path="collaborations" element={<AdminCollaborations />} />
              <Route path="collaborations/:id" element={<AdminCollaborationDetail />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="opportunities" element={<AdminOpportunities />} />
              <Route path="opportunities/:id" element={<AdminOpportunityDetail />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
