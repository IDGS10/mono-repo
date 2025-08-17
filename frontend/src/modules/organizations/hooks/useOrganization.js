import { useState, useEffect } from 'react';
import OrganizationService from '../services/organizationService';

export const useOrganization = () => {
  const [organization, setOrganization] = useState(null);
  const [hasOrganization, setHasOrganization] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await OrganizationService.hasOrganization();
      setHasOrganization(result.hasOrganization);
      setOrganization(result.organization);
    } catch (err) {
      setError(err.message);
      setHasOrganization(false);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  const createOrganization = async (organizationData) => {
    try {
      setLoading(true);
      setError(null);

      const validation = OrganizationService.validateOrganizationData(organizationData);
      if (!validation.isValid) {
        throw new Error('Datos de organización inválidos');
      }

      const result = await OrganizationService.create(organizationData);
      
      // Refresh organization data after creation
      await fetchOrganization();
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOrganization = async (id, organizationData) => {
    try {
      setLoading(true);
      setError(null);

      const validation = OrganizationService.validateOrganizationData(organizationData);
      if (!validation.isValid) {
        throw new Error('Datos de organización inválidos');
      }

      const result = await OrganizationService.update(id, organizationData);
      
      // Update local state
      setOrganization(result.organization);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOrganizationStatus = async (id, isActive) => {
    try {
      setLoading(true);
      setError(null);

      const result = await OrganizationService.updateStatus(id, isActive);
      
      // Update local state
      if (organization) {
        setOrganization({
          ...organization,
          isactive: result.organization.isactive
        });
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshOrganization = () => {
    fetchOrganization();
  };

  return {
    organization,
    hasOrganization,
    loading,
    error,
    createOrganization,
    updateOrganization,
    updateOrganizationStatus,
    refreshOrganization
  };
};

export const useOrganizationTypes = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await OrganizationService.getTypes();
        setTypes(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTypes();
  }, []);

  return { types, loading, error };
};

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await OrganizationService.getDashboard();
      setDashboardData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const refreshDashboard = () => {
    fetchDashboard();
  };

  return {
    dashboardData,
    loading,
    error,
    refreshDashboard
  };
};