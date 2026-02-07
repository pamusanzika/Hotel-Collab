import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../api/axios';

const HotelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const HotelRow = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HotelInfo = styled.div`
  flex: 1;
`;

const HotelName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: 0.15rem;
`;

const HotelMeta = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const OwnerHotels = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);

  const fetchHotels = async () => {
    try {
      const { data } = await api.get('/hotels');
      setHotels(data.hotels);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchHotels(); }, []);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this hotel?')) return;
    try {
      await api.delete(`/hotels/${id}`);
      fetchHotels();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <PageHeader title="My Hotels" subtitle="Manage your hotel listings" />
      <div style={{ marginBottom: '1rem' }}>
        <Button $variant="primary" onClick={() => navigate('/owner/hotels/add')}>
          + Add Hotel
        </Button>
      </div>

      {hotels.length === 0 ? (
        <EmptyState>No hotels yet. Add your first hotel listing.</EmptyState>
      ) : (
        <HotelList>
          {hotels.map((h) => (
            <HotelRow key={h._id}>
              <HotelInfo>
                <HotelName>{h.name}</HotelName>
                <HotelMeta>{h.location || 'No location'}{h.city ? `, ${h.city}` : ''}</HotelMeta>
              </HotelInfo>
              <Badge $variant={h.isActive ? 'active' : 'pending'}>
                {h.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Actions>
                <Button $variant="secondary" $size="sm" onClick={() => navigate(`/owner/hotels/preview/${h._id}`)}>
                  Preview
                </Button>
                <Button $variant="ghost" $size="sm" onClick={() => navigate(`/owner/hotels/edit/${h._id}`)}>
                  Edit
                </Button>
                <Button $variant="danger" $size="sm" onClick={() => onDelete(h._id)}>
                  Delete
                </Button>
              </Actions>
            </HotelRow>
          ))}
        </HotelList>
      )}
    </>
  );
};

export default OwnerHotels;
