import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  Home, 
  CheckCircle2, 
  ArrowRight,
  Save
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const BuildingSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [buildingData, setBuildingData] = useState({
    name: user?.metadata?.buildingName || '',
    address: user?.metadata?.buildingAddress || '',
    totalUnits: 0,
    buildingAge: 0,
    buildingType: '',
    serviceChargeFrequency: 'Quarterly',
    managementStructure: user?.role?.includes('rtm') ? 'rtm' : 'share-of-freehold'
  });

  useEffect(() => {
    const fetchBuildingData = async () => {
      if (!user?.metadata?.buildingId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('buildings')
          .select('*')
          .eq('id', user.metadata.buildingId)
          .single();

        if (error) throw error;

        if (data) {
          setBuildingData({
            name: data.name || '',
            address: data.address || '',
            totalUnits: data.total_units || 0,
            buildingAge: data.building_age || 0,
            buildingType: data.building_type || '',
            serviceChargeFrequency: data.service_charge_frequency || 'Quarterly',
            managementStructure: data.management_structure || (user.role?.includes('rtm') ? 'rtm' : 'share-of-freehold')
          });
        }
      } catch (error: any) {
        console.error('Error fetching building data:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuildingData();
  }, [user?.metadata?.buildingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBuildingData(prev => ({
      ...prev,
      [name]: name === 'totalUnits' || name === 'buildingAge' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      if (!user?.metadata?.buildingId) {
        throw new Error('Building ID not found');
      }

      const { error } = await supabase
        .from('buildings')
        .update({
          name: buildingData.name,
          address: buildingData.address,
          total_units: buildingData.totalUnits,
          building_age: buildingData.buildingAge,
          building_type: buildingData.buildingType,
          service_charge_frequency: buildingData.serviceChargeFrequency,
          management_structure: buildingData.managementStructure
        })
        .eq('id', user.metadata.buildingId);

      if (error) throw error;

      // Update onboarding steps if they exist
      const { error: stepsError } = await supabase
        .from('onboarding_steps')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('step_name', 'building');

      if (stepsError) console.error('Error updating onboarding step:', stepsError);

      setSuccess(true);
      setTimeout(() => {
        const basePath = user.role?.split('-')[0];
        navigate(`/${basePath}`);
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 lg:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Building Setup</h1>
          <p className="text-gray-600 mt-1">Configure your building information</p>
        </div>
      </div>

      <Card>
        {success ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-success-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-success-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Building Setup Complete!</h3>
            <p className="text-center text-gray-600">
              Your building information has been saved successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error-50 text-error-700 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Building Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={buildingData.name}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Waterside Apartments"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Building Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="address"
                    value={buildingData.address}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., 123 Riverside Drive, London SE1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Units
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="totalUnits"
                    value={buildingData.totalUnits}
                    onChange={handleChange}
                    min="1"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Building Age (years)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="buildingAge"
                    value={buildingData.buildingAge}
                    onChange={handleChange}
                    min="0"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Building Type
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={16} className="text-gray-400" />
                  </div>
                  <select
                    name="buildingType"
                    value={buildingData.buildingType}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Building Type</option>
                    <option value="apartment-block">Apartment Block</option>
                    <option value="converted-house">Converted House</option>
                    <option value="mixed-use">Mixed Use</option>
                    <option value="mansion-block">Mansion Block</option>
                    <option value="townhouse">Townhouse</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Service Charge Frequency
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <select
                    name="serviceChargeFrequency"
                    value={buildingData.serviceChargeFrequency}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Bi-Annually">Bi-Annually</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Management Structure
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={16} className="text-gray-400" />
                  </div>
                  <select
                    name="managementStructure"
                    value={buildingData.managementStructure}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    disabled={true} // Disabled because it's determined by user role
                  >
                    <option value="rtm">Right to Manage (RTM)</option>
                    <option value="share-of-freehold">Share of Freehold</option>
                    <option value="landlord-managed">Landlord Managed</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Management structure is determined by your account type
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                leftIcon={<Save size={16} />}
                isLoading={isSaving}
              >
                Save Building Information
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default BuildingSetup;