import React, { useState, useEffect } from 'react';
import { X, Wallet, PiggyBank, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface FinancialSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

const FinancialSetupModal = ({ isOpen, onClose, onSetupComplete }: FinancialSetupModalProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    serviceChargeAccountBalance: 0,
    reserveFundBalance: 0,
    serviceChargeFrequency: 'Quarterly',
    totalAnnualBudget: 0,
    hasMajorWorks: false,
    majorWorksDescription: '',
    majorWorksCost: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateStep = (step: number): boolean => {
    setError(null);
    
    if (step === 1) {
      if (formData.serviceChargeAccountBalance < 0) {
        setError('Service charge account balance cannot be negative');
        return false;
      }
      if (formData.reserveFundBalance < 0) {
        setError('Reserve fund balance cannot be negative');
        return false;
      }
    } else if (step === 2) {
      if (formData.totalAnnualBudget <= 0) {
        setError('Total annual budget must be greater than zero');
        return false;
      }
      if (formData.hasMajorWorks && !formData.majorWorksDescription) {
        setError('Please provide a description for the major works');
        return false;
      }
      if (formData.hasMajorWorks && formData.majorWorksCost <= 0) {
        setError('Major works cost must be greater than zero');
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Final validation
    if (!validateStep(currentStep)) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('financial_setup')
        .insert([
          {
            building_id: user?.metadata?.buildingId,
            service_charge_account_balance: formData.serviceChargeAccountBalance,
            reserve_fund_balance: formData.reserveFundBalance,
            service_charge_frequency: formData.serviceChargeFrequency,
            total_annual_budget: formData.totalAnnualBudget,
            has_major_works: formData.hasMajorWorks,
            major_works_description: formData.majorWorksDescription,
            major_works_cost: formData.majorWorksCost,
            created_by: user?.id
          }
        ])
        .select();

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        onSetupComplete();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div className="flex items-center">
              <Wallet className="mr-2 h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Financial Setup</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {success ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4 rounded-full bg-success-100 p-3">
                  <CheckCircle2 className="h-8 w-8 text-success-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">Setup Complete!</h3>
                <p className="text-center text-gray-600">
                  Your financial information has been saved successfully. Your dashboard will now be populated with this data.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-4 rounded-md bg-error-50 p-4 text-sm text-error-500">
                    {error}
                  </div>
                )}

                {/* Step indicators */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      1
                    </div>
                    <div className={`mx-2 h-1 w-8 ${
                      currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'
                    }`}></div>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      2
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Step {currentStep} of 2
                  </div>
                </div>

                {/* Step 1: Account Balances */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Account Balances</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Enter your current financial account balances
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="serviceChargeAccountBalance" className="block text-sm font-medium text-gray-700">
                          Service Charge Account Balance (£)
                        </label>
                        <div className="relative mt-1">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Wallet className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            id="serviceChargeAccountBalance"
                            name="serviceChargeAccountBalance"
                            value={formData.serviceChargeAccountBalance}
                            onChange={handleChange}
                            className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 focus:border-primary-500 focus:ring-primary-500"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="reserveFundBalance" className="block text-sm font-medium text-gray-700">
                          Reserve Fund Balance (£)
                        </label>
                        <div className="relative mt-1">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <PiggyBank className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            id="reserveFundBalance"
                            name="reserveFundBalance"
                            value={formData.reserveFundBalance}
                            onChange={handleChange}
                            className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 focus:border-primary-500 focus:ring-primary-500"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="serviceChargeFrequency" className="block text-sm font-medium text-gray-700">
                          Service Charge Collection Frequency
                        </label>
                        <div className="relative mt-1">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <select
                            id="serviceChargeFrequency"
                            name="serviceChargeFrequency"
                            value={formData.serviceChargeFrequency}
                            onChange={handleChange}
                            className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 focus:border-primary-500 focus:ring-primary-500"
                          >
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Bi-Annually">Bi-Annually</option>
                            <option value="Annually">Annually</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Budget Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Budget Information</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Enter your annual budget and any planned major works
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="totalAnnualBudget" className="block text-sm font-medium text-gray-700">
                          Total Annual Budget (£)
                        </label>
                        <div className="relative mt-1">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Wallet className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            id="totalAnnualBudget"
                            name="totalAnnualBudget"
                            value={formData.totalAnnualBudget}
                            onChange={handleChange}
                            className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 focus:border-primary-500 focus:ring-primary-500"
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasMajorWorks"
                          name="hasMajorWorks"
                          checked={formData.hasMajorWorks}
                          onChange={(e) => setFormData(prev => ({ ...prev, hasMajorWorks: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="hasMajorWorks" className="ml-2 block text-sm text-gray-700">
                          Planned major works in the next 12 months
                        </label>
                      </div>

                      {formData.hasMajorWorks && (
                        <>
                          <div>
                            <label htmlFor="majorWorksDescription" className="block text-sm font-medium text-gray-700">
                              Description of Major Works
                            </label>
                            <textarea
                              id="majorWorksDescription"
                              name="majorWorksDescription"
                              value={formData.majorWorksDescription}
                              onChange={handleChange}
                              rows={3}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
                              required={formData.hasMajorWorks}
                            />
                          </div>

                          <div>
                            <label htmlFor="majorWorksCost" className="block text-sm font-medium text-gray-700">
                              Estimated Cost (£)
                            </label>
                            <div className="relative mt-1">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Wallet className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="number"
                                id="majorWorksCost"
                                name="majorWorksCost"
                                value={formData.majorWorksCost}
                                onChange={handleChange}
                                className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 focus:border-primary-500 focus:ring-primary-500"
                                step="0.01"
                                min="0"
                                required={formData.hasMajorWorks}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                  )}
                  
                  {currentStep < 2 ? (
                    <Button
                      variant="primary"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmitting}
                    >
                      Complete Setup
                    </Button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSetupModal;