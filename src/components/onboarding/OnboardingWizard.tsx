import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Building2, 
  User, 
  FileText, 
  Wallet, 
  Users, 
  ArrowRight, 
  ChevronRight 
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  route: string;
}

const OnboardingWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Define steps based on user role
    const baseSteps: OnboardingStep[] = [
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Add your personal information and contact details',
        icon: User,
        completed: false,
        route: '/profile'
      },
      {
        id: 'building',
        title: 'Building Information',
        description: 'Add details about your building',
        icon: Building2,
        completed: false,
        route: `/${user.role?.split('-')[0]}/building-setup`
      },
      {
        id: 'documents',
        title: 'Upload Documents',
        description: 'Add important building documents',
        icon: FileText,
        completed: false,
        route: `/${user.role?.split('-')[0]}/documents`
      }
    ];

    // Add role-specific steps
    if (user.role === 'rtm-director' || user.role === 'sof-director') {
      baseSteps.push({
        id: 'finances',
        title: 'Financial Setup',
        description: 'Configure your financial information',
        icon: Wallet,
        completed: false,
        route: `/${user.role?.split('-')[0]}/finances`
      });
      
      baseSteps.push({
        id: 'members',
        title: 'Invite Members',
        description: 'Add other residents to your building',
        icon: Users,
        completed: false,
        route: `/${user.role?.split('-')[0]}/members`
      });
    }

    // Check which steps are completed
    const checkCompletedSteps = async () => {
      setLoading(true);
      try {
        // Check profile completion
        const profileComplete = !!(user.metadata?.firstName && user.metadata?.lastName);
        
        // Check building setup
        const { data: buildingData } = await supabase
          .from('buildings')
          .select('*')
          .eq('id', user.metadata?.buildingId)
          .single();
        
        const buildingComplete = !!(buildingData?.name && buildingData?.address);
        
        // Check documents
        const { data: documents } = await supabase
          .from('onboarding_documents')
          .select('id')
          .eq('building_id', user.metadata?.buildingId);
        
        const documentsComplete = documents && documents.length > 0;
        
        // Check finances (for directors)
        let financesComplete = true;
        if (user.role === 'rtm-director' || user.role === 'sof-director') {
          const { data: financialSetup } = await supabase
            .from('financial_setup')
            .select('id')
            .eq('building_id', user.metadata?.buildingId);
          
          financesComplete = financialSetup && financialSetup.length > 0;
        }
        
        // Check members (for directors)
        let membersComplete = true;
        if (user.role === 'rtm-director' || user.role === 'sof-director') {
          const { data: members } = await supabase
            .from('building_users')
            .select('id')
            .eq('building_id', user.metadata?.buildingId)
            .neq('user_id', user.id);
          
          membersComplete = members && members.length > 0;
        }
        
        // Update steps with completion status
        const updatedSteps = baseSteps.map(step => {
          if (step.id === 'profile') return { ...step, completed: profileComplete };
          if (step.id === 'building') return { ...step, completed: buildingComplete };
          if (step.id === 'documents') return { ...step, completed: documentsComplete };
          if (step.id === 'finances') return { ...step, completed: financesComplete };
          if (step.id === 'members') return { ...step, completed: membersComplete };
          return step;
        });
        
        setSteps(updatedSteps);
        setCompletedSteps(updatedSteps.filter(step => step.completed).length);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkCompletedSteps();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
  const nextIncompleteStep = steps.find(step => !step.completed);

  return (
    <Card className="mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Welcome to Manage.Management</h2>
          <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
            {progress}% Complete
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-primary-600 h-2 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center p-4 rounded-lg border ${
                step.completed 
                  ? 'border-success-500 bg-success-50' 
                  : index === steps.findIndex(s => !s.completed)
                    ? 'border-primary-500 bg-primary-50 animate-border-pulse'
                    : 'border-gray-200'
              }`}
            >
              <div className={`p-2 rounded-full ${
                step.completed 
                  ? 'bg-success-100 text-success-600' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {step.completed ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
              </div>
              
              <div className="ml-4 flex-1">
                <h3 className="font-medium text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
              
              <Button
                variant={step.completed ? "outline" : "primary"}
                size="sm"
                rightIcon={<ChevronRight size={16} />}
                onClick={() => navigate(step.route)}
              >
                {step.completed ? 'View' : 'Complete'}
              </Button>
            </div>
          ))}
        </div>
        
        {nextIncompleteStep && (
          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              rightIcon={<ArrowRight size={16} />}
              onClick={() => navigate(nextIncompleteStep.route)}
            >
              Continue Setup
            </Button>
          </div>
        )}
        
        {completedSteps === steps.length && (
          <div className="mt-6 bg-success-50 p-4 rounded-lg border border-success-100">
            <div className="flex items-center">
              <CheckCircle2 size={24} className="text-success-500 mr-3" />
              <div>
                <h3 className="font-medium text-success-700">Setup Complete!</h3>
                <p className="text-sm text-success-600">
                  You've completed all the onboarding steps. Your building is now fully set up.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default OnboardingWizard;