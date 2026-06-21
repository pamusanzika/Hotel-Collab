import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../api/axios';

const Filters = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const FilterBtn = styled(Button)`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const SearchInput = styled.input`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  width: 100%;
  max-width: 320px;
  outline: none;
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  vertical-align: middle;
`;

const RoleBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: capitalize;
`;

const statusVariant = (status) => {
  if (status === 'active') return 'active';
  if (status === 'banned') return 'banned';
  return 'pending';
};

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.role = filter;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleBan = async (id) => {
    if (!window.confirm('Ban this user?')) return;
    try {
      await api.post(`/admin/users/${id}/ban`, { reason: 'Admin action' });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnban = async (id) => {
    try {
      await api.post(`/admin/users/${id}/unban`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <PageHeader title="Users" subtitle="Manage platform users" />

      <ToolbarRow>
        <Filters>
          <FilterBtn
            $variant={filter === '' ? 'primary' : 'ghost'}
            $size="sm"
            onClick={() => setFilter('')}
          >
            All
          </FilterBtn>
          <FilterBtn
            $variant={filter === 'hotel_owner' ? 'primary' : 'ghost'}
            $size="sm"
            onClick={() => setFilter('hotel_owner')}
          >
            Hotel Owners
          </FilterBtn>
          <FilterBtn
            $variant={filter === 'influencer' ? 'primary' : 'ghost'}
            $size="sm"
            onClick={() => setFilter('influencer')}
          >
            Content Creators
          </FilterBtn>
        </Filters>
        <SearchInput
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </ToolbarRow>

      <Card $padding="0">
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Joined</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <Td>{u.name}</Td>
                <Td>{u.email}</Td>
                <Td><RoleBadge>{u.role?.replace('_', ' ')}</RoleBadge></Td>
                <Td>
                  <Badge $variant={statusVariant(u.status)}>
                    {u.status === 'pending_verification' ? 'Pending' : u.status}
                  </Badge>
                </Td>
                <Td>{new Date(u.createdAt).toLocaleDateString()}</Td>
                <Td style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Button $variant="ghost" $size="sm" onClick={() => navigate(`/admin/users/${u._id}`)}>
                    View
                  </Button>
                  {u.status === 'banned' ? (
                    <Button $variant="primary" $size="sm" onClick={() => handleUnban(u._id)}>
                      Unban
                    </Button>
                  ) : u.role !== 'admin' ? (
                    <Button $variant="danger" $size="sm" onClick={() => handleBan(u._id)}>
                      Ban
                    </Button>
                  ) : null}
                </Td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <Td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  {loading ? 'Loading...' : 'No users found'}
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </>
  );
};

export default AdminUsers;
