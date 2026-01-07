import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2, Phone, UserCog } from 'lucide-react';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits').regex(/^\d+$/, 'Phone number must contain only digits');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; phoneNumber?: string }>({});
  
  const { signIn, signUp, user, loading, isApproved, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      // Check if user is approved
      if (profile && !profile.is_approved) {
        // User is logged in but not approved - sign them out
        return;
      }
      navigate('/');
    }
  }, [user, loading, navigate, profile]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string; phoneNumber?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (!isLogin) {
      if (!fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      const phoneResult = phoneSchema.safeParse(phoneNumber);
      if (!phoneResult.success) {
        newErrors.phoneNumber = phoneResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login failed',
            description: error.message === 'Invalid login credentials' 
              ? 'Invalid email or password. Please try again.'
              : error.message,
            variant: 'destructive',
          });
        } else {
          // After successful login, check approval status
          // This will be handled in the useEffect after profile loads
          toast({
            title: 'Checking access...',
            description: 'Verifying your account status.',
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName, phoneNumber, selectedRole);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please sign in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Registration submitted!',
            description: 'Your account has been created. Please wait for Super Admin approval before you can log in.',
          });
          setIsLogin(true);
          setEmail('');
          setPassword('');
          setFullName('');
          setPhoneNumber('');
          setSelectedRole('employee');
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show pending approval message if logged in but not approved
  if (user && profile && !profile.is_approved) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-[0.02] pointer-events-none" />
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
        
        <div className="w-full max-w-md glass-strong rounded-2xl p-8 border border-border text-center">
          <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Pending Approval</h1>
          <p className="text-muted-foreground mb-6">
            Your account is pending approval from the Super Admin. You will be able to access the workspace once approved.
          </p>
          <button
            onClick={async () => {
              const { signOut } = useAuth();
              await signOut();
            }}
            className="w-full bg-secondary text-foreground py-3 rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-[0.02] pointer-events-none" />
      
      {/* Glow effects */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center glow-primary">
          <Shield className="w-7 h-7 text-primary-foreground" />
        </div>
        <span className="text-3xl font-bold tracking-tight">
          AKEF<span className="gradient-text">WORKSPACE</span>
        </span>
      </div>
      
      {/* Auth Card */}
      <div className="w-full max-w-md glass-strong rounded-2xl p-8 border border-border animate-slide-up">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLogin ? 'Sign in to access your workspace' : 'Join the AKEF team today'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: undefined })); }}
                    placeholder="Your full name"
                    className={`w-full bg-secondary border ${errors.fullName ? 'border-destructive' : 'border-border'} rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors`}
                  />
                </div>
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => { setPhoneNumber(e.target.value.replace(/\D/g, '')); setErrors(prev => ({ ...prev, phoneNumber: undefined })); }}
                    placeholder="Your phone number"
                    className={`w-full bg-secondary border ${errors.phoneNumber ? 'border-destructive' : 'border-border'} rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors`}
                  />
                </div>
                {errors.phoneNumber && <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                <div className="relative">
                  <UserCog size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value as AppRole)}
                    className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                  >
                    <option value="state_member">State Member</option>
                    <option value="district_member">District Member</option>
                    <option value="employee">Employee</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                placeholder="you@example.com"
                className={`w-full bg-secondary border ${errors.email ? 'border-destructive' : 'border-border'} rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors`}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                placeholder="••••••••"
                className={`w-full bg-secondary border ${errors.password ? 'border-destructive' : 'border-border'} rounded-xl pl-10 pr-12 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors glow-primary disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
        
        {!isLogin && (
          <p className="text-xs text-muted-foreground text-center mt-4 px-4">
            After registration, your account will need to be approved by the Super Admin before you can log in.
          </p>
        )}
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
      
      {/* Footer */}
      <p className="text-xs text-muted-foreground mt-8">
        &copy; 2025 Association of Kerala Esports Federation
      </p>
    </div>
  );
};

export default Auth;
