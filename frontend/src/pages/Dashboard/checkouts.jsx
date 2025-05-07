import React, { useState, useEffect } from 'react';
import { Card, Button, Table, message } from 'antd';
import { fetchTodaysCheckins, registerCheckOut } from '@/services/dashboardService';
import { useAuth } from '@/hooks/useAuth';

export default function Checkouts() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Solo permitir acceso a jefes de obra (rol 3)
  if (user?.role !== 3) {
    return (
      <Card title="Acceso Denegado">
        <p>No tienes permiso para acceder a esta sección.</p>
      </Card>
    );
  }

  useEffect(() => {
    loadCheckins();
  }, []);

  const loadCheckins = async () => {
    try {
      setLoading(true);
      const data = await fetchTodaysCheckins();
      setCheckins(data);
    } catch (error) {
      message.error('Error al cargar los check-ins del día');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (checkInId) => {
    try {
      await registerCheckOut(checkInId);
      message.success('Check-out registrado correctamente');
      loadCheckins(); // Recargar la lista
    } catch (error) {
      message.error('Error al registrar el check-out');
    }
  };

  const columns = [
    {
      title: 'Trabajador',
      dataIndex: 'workerName',
      key: 'workerName',
    },
    {
      title: 'Hora de Check-in',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (text) => new Date(text).toLocaleTimeString(),
    },
    {
      title: 'Zona',
      dataIndex: 'zoneName',
      key: 'zoneName',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => status === 'active' ? 'Activo' : 'Finalizado',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        record.status === 'active' && (
          <Button 
            type="primary"
            onClick={() => handleCheckout(record.id)}
          >
            Hacer Check-out
          </Button>
        )
      ),
    },
  ];

  return (
    <Card title="Gestión de Check-outs" className="dashboard-card">
      <Table
        columns={columns}
        dataSource={checkins}
        loading={loading}
        rowKey="id"
        pagination={false}
      />
    </Card>
  );
} 