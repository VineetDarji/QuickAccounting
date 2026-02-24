import React, { useMemo, useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Inquiry, SavedCalculation } from './types';
import { useUserStore } from './store/userStore';
import toast from 'react-hot-toast';
import { sendVerificationCode } from './services/emailService';
import { loginWithPassword, signup } from './services/authService';
import { CALCULATOR_CATEGORIES, CALCULATORS } from './config/calculators';
import { logActivity } from './services/activityService';
import { scheduleLocalDataSync } from './services/dataSyncService';
import {
    clearRecentTools,
    getToolPreferences,
    makeToolKey,
    recordToolUsage,
    toggleFavoriteTool,
    ToolCategoryId,
} from './services/toolPreferencesService';

const Home = lazy(() => import('./pages/Home'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminDashboardMaster = lazy(() => import('./pages/AdminDashboardMaster'));
const TaxNews = lazy(() => import('./pages/TaxNews'));
const UsefulLinks = lazy(() => import('./pages/UsefulLinks'));
const MyRecords = lazy(() => import('./pages/MyRecords'));
const Visualizer = lazy(() => import('./pages/Visualizer'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Cases = lazy(() => import('./pages/Cases'));
const CaseDetails = lazy(() => import('./pages/CaseDetails'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));

const Login: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newConfirmPassword, setNewConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState<'credentials' | 'verification' | 'reset_password'>('credentials');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [showDemoCode, setShowDemoCode] = useState(false);
    const login = useUserStore((state) => state.login);
    const canUseDemoCode =
        typeof window !== 'undefined' &&
        ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
    const testAccounts = [
        { email: 'admin@test.local', password: 'Test@123', name: 'Admin User', firstName: 'Admin', middleName: '', lastName: 'User', role: 'admin' },
        { email: 'employee@test.local', password: 'Test@123', name: 'Employee User', firstName: 'Employee', middleName: '', lastName: 'User', role: 'employee' },
    ] as const;

    // Email validation
    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Password validation (min 6 characters)
    const isValidPassword = (password: string) => {
        return password.length >= 6;
    };

    const buildFullName = () =>
        [firstName, middleName, lastName]
            .map((part) => String(part || '').trim())
            .filter(Boolean)
            .join(' ');

    // Check if email already exists
    const emailExists = (email: string) => {
        const users = JSON.parse(localStorage.getItem('quickaccounting_users') || '[]');
        return users.some((user: any) => user.email === email);
    };

    const upsertLocalUser = (userData: any) => {
        const users = JSON.parse(localStorage.getItem('quickaccounting_users') || '[]');
        const idx = users.findIndex((u: any) => String(u?.email || '').toLowerCase() === String(userData?.email || '').toLowerCase());
        if (idx >= 0) users[idx] = { ...users[idx], ...userData, updatedAt: Date.now() };
        else users.push({ ...userData, createdAt: Date.now(), updatedAt: Date.now() });
        localStorage.setItem('quickaccounting_users', JSON.stringify(users));
        scheduleLocalDataSync();
    };

    const updateUserPassword = (email: string, nextPassword: string) => {
        const users = JSON.parse(localStorage.getItem('quickaccounting_users') || '[]');
        const idx = users.findIndex((user: any) => user.email === email);
        if (idx < 0) return false;
        users[idx] = { ...users[idx], password: nextPassword, updatedAt: Date.now() };
        localStorage.setItem('quickaccounting_users', JSON.stringify(users));
        scheduleLocalDataSync();
        return true;
    };

    useEffect(() => {
        if (!canUseDemoCode) return;
        const users = JSON.parse(localStorage.getItem('quickaccounting_users') || '[]');
        const next = [...users];
        let changed = false;
        testAccounts.forEach((account) => {
            const idx = next.findIndex((u: any) => u?.email === account.email);
            if (idx >= 0) {
                const existing = next[idx];
                const normalized = {
                    ...existing,
                    name: account.name,
                    firstName: account.firstName,
                    middleName: account.middleName,
                    lastName: account.lastName,
                    email: account.email,
                    password: account.password,
                    role: account.role,
                    updatedAt: Date.now(),
                };
                if (
                    existing.name !== normalized.name ||
                    existing.firstName !== normalized.firstName ||
                    existing.middleName !== normalized.middleName ||
                    existing.lastName !== normalized.lastName ||
                    existing.password !== normalized.password ||
                    existing.role !== normalized.role
                ) {
                    next[idx] = normalized;
                    changed = true;
                }
            } else {
                next.push({
                    ...account,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                changed = true;
            }
        });
        if (changed) {
            localStorage.setItem('quickaccounting_users', JSON.stringify(next));
            scheduleLocalDataSync();
        }
    }, [canUseDemoCode]);

    const startResetFlow = () => {
        setIsResetting(true);
        setIsSignUp(false);
        setStep('credentials');
        setError('');
        setShowDemoCode(false);
        setPassword('');
        setConfirmPassword('');
        setNewPassword('');
        setNewConfirmPassword('');
        setVerificationCode('');
        setGeneratedCode('');
    };

    const cancelResetFlow = () => {
        setIsResetting(false);
        setStep('credentials');
        setError('');
        setShowDemoCode(false);
        setNewPassword('');
        setNewConfirmPassword('');
        setVerificationCode('');
        setGeneratedCode('');
    };

    const handleResetRequestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!isValidEmail(email)) {
            setError('Please enter a valid email address');
            setIsLoading(false);
            return;
        }

        if (!emailExists(email)) {
            setError('No account found with this email. Please sign up first.');
            setIsLoading(false);
            return;
        }

        // Generate reset verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);

        sendVerificationCode(email, code).then((success) => {
            setTimeout(() => {
                if (success) {
                    setShowDemoCode(false);
                    toast.success(`Reset code sent to ${email}`);
                    setStep('verification');
                } else if (canUseDemoCode) {
                    setShowDemoCode(true);
                    toast.error('Email service unavailable. Using demo code (local only).');
                    toast(`Demo code: ${code}`);
                    setStep('verification');
                } else {
                    setShowDemoCode(false);
                    toast.error('Email service unavailable. Please try again later.');
                    setStep('credentials');
                }
                setIsLoading(false);
            }, 1000);
        });
    };

    const handleResetPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!isValidPassword(newPassword)) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        if (newPassword !== newConfirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (!emailExists(email)) {
            setError('No account found with this email. Please sign up first.');
            setIsLoading(false);
            return;
        }

        setTimeout(() => {
            const updated = updateUserPassword(email, newPassword);
            if (!updated) {
                setError('Could not update password. Please try again.');
                setIsLoading(false);
                return;
            }

            toast.success('Password updated. Please sign in.');
            setPassword('');
            setConfirmPassword('');
            setNewPassword('');
            setNewConfirmPassword('');
             setVerificationCode('');
             setGeneratedCode('');
             setIsResetting(false);
             setShowDemoCode(false);
             setStep('credentials');
             setIsLoading(false);
         }, 800);
     };

    const handleSignUpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Validations
        if (!firstName.trim()) {
            setError('Please enter your first name');
            setIsLoading(false);
            return;
        }

        if (!lastName.trim()) {
            setError('Please enter your last name');
            setIsLoading(false);
            return;
        }

        if (!isValidEmail(email)) {
            setError('Please enter a valid email address');
            setIsLoading(false);
            return;
        }

        if (emailExists(email)) {
            setError('This email is already registered. Please sign in instead.');
            setIsLoading(false);
            return;
        }

        if (!isValidPassword(password)) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        // Generate verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);

        // Send email with verification code
        sendVerificationCode(email, code).then((success) => {
            setTimeout(() => {
                if (success) {
                    setShowDemoCode(false);
                    toast.success(`Verification code sent to ${email}`);
                    setStep('verification');
                } else if (canUseDemoCode) {
                    setShowDemoCode(true);
                    toast.error('Email service unavailable. Using demo code (local only).');
                    toast(`Demo code: ${code}`);
                    setStep('verification');
                } else {
                    setShowDemoCode(false);
                    toast.error('Email service unavailable. Please try again later.');
                    setStep('credentials');
                }
                setIsLoading(false);
            }, 1000);
        });
    };

    const handleSignInSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!isValidEmail(email)) {
            setError('Please enter a valid email address');
            setIsLoading(false);
            return;
        }

        if (!isValidPassword(password)) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        // Generate verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);

        // Send email with verification code
        sendVerificationCode(email, code).then((success) => {
            setTimeout(() => {
                if (success) {
                    setShowDemoCode(false);
                    toast.success(`Verification code sent to ${email}`);
                    setStep('verification');
                } else if (canUseDemoCode) {
                    setShowDemoCode(true);
                    toast.error('Email service unavailable. Using demo code (local only).');
                    toast(`Demo code: ${code}`);
                    setStep('verification');
                } else {
                    setShowDemoCode(false);
                    toast.error('Email service unavailable. Please try again later.');
                    setStep('credentials');
                }
                setIsLoading(false);
            }, 1000);
        });
    };

    const handleVerificationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (verificationCode !== generatedCode) {
            setError('Incorrect verification code. Please try again.');
            setIsLoading(false);
            return;
        }

        setShowDemoCode(false);

        setTimeout(async () => {
            if (isResetting) {
                setVerificationCode('');
                setStep('reset_password');
                setIsLoading(false);
                return;
            }

            if (isSignUp) {
                try {
                    const auth = await signup({
                        email,
                        password,
                        firstName: firstName.trim(),
                        middleName: middleName.trim(),
                        lastName: lastName.trim(),
                    });
                    localStorage.setItem('tax_auth_token', auth.token);
                    upsertLocalUser({
                        email: auth.user.email,
                        name: auth.user.name,
                        firstName: auth.user.firstName || firstName.trim(),
                        middleName: auth.user.middleName || middleName.trim(),
                        lastName: auth.user.lastName || lastName.trim(),
                        role: auth.user.role,
                    });
                    login(auth.user);
                    toast.success('Account created successfully!');
                } catch {
                    setError('Could not create account from server. Please try again.');
                    setStep('credentials');
                    setIsLoading(false);
                    return;
                }
            } else {
                try {
                    const auth = await loginWithPassword({ email, password });
                    localStorage.setItem('tax_auth_token', auth.token);
                    upsertLocalUser({
                        email: auth.user.email,
                        name: auth.user.name,
                        firstName: auth.user.firstName || '',
                        middleName: auth.user.middleName || '',
                        lastName: auth.user.lastName || '',
                        role: auth.user.role,
                    });
                    login(auth.user);
                    toast.success('Login successful!');
                } catch {
                    setError('Invalid email or password. Please try again.');
                    setStep('credentials');
                    setIsLoading(false);
                    return;
                }
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                    {step === 'credentials'
                        ? isResetting
                            ? 'Reset Password'
                            : isSignUp
                                ? 'Create Account'
                                : 'Welcome Back'
                        : step === 'verification'
                            ? isResetting
                                ? 'Verify Reset Code'
                                : 'Verify Your Identity'
                            : 'Set New Password'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    {step === 'credentials'
                        ? isResetting
                            ? 'We’ll email you a 6-digit code to reset your password'
                            : isSignUp
                                ? 'Join Quick Accounting Service today'
                                : 'Sign in to manage your profile'
                        : step === 'verification'
                            ? isResetting
                                ? 'Enter the reset code sent to your email'
                                : 'Enter the verification code sent to your email'
                            : 'Choose a new password for your account'}
                </p>

                {step === 'credentials' ? (
                    <form
                        onSubmit={isResetting ? handleResetRequestSubmit : isSignUp ? handleSignUpSubmit : handleSignInSubmit}
                        className="space-y-6"
                    >
                        {isSignUp && (
                            <div className="grid md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => {
                                            setFirstName(e.target.value);
                                            setError('');
                                        }}
                                        className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
                                        placeholder="First"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Middle Name</label>
                                    <input
                                        type="text"
                                        value={middleName}
                                        onChange={(e) => {
                                            setMiddleName(e.target.value);
                                            setError('');
                                        }}
                                        className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
                                        placeholder="Middle (optional)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => {
                                            setLastName(e.target.value);
                                            setError('');
                                        }}
                                        className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
                                        placeholder="Last"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
                                placeholder="your.email@example.com"
                            />
                        </div>

                        {!isResetting && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
                                    placeholder="••••••••"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimum 6 characters</p>
                            </div>
                        )}

                        {!isSignUp && !isResetting && (
                            <button
                                type="button"
                                onClick={startResetFlow}
                                className="w-full text-right text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                                Forgot password?
                            </button>
                        )}

                        {isSignUp && !isResetting && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setError('');
                                    }}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm font-semibold text-red-600 dark:text-red-400">❌ {error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-indigo-300 dark:hover:shadow-indigo-900 transition-all shadow-md disabled:opacity-50"
                        >
                            {isLoading ? 'Verifying...' : isResetting ? 'Send Reset Code' : isSignUp ? 'Create Account' : 'Sign In'}
                        </button>

                        {isResetting ? (
                            <button
                                type="button"
                                onClick={cancelResetFlow}
                                className="w-full text-indigo-600 dark:text-indigo-400 py-2 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                                ← Back to Sign In
                            </button>
                        ) : (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">or</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        cancelResetFlow();
                                        setIsSignUp(!isSignUp);
                                        setError('');
                                        setEmail('');
                                        setPassword('');
                                        setConfirmPassword('');
                                        setFirstName('');
                                        setMiddleName('');
                                        setLastName('');
                                    }}
                                    className="w-full text-indigo-600 dark:text-indigo-400 py-2 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                >
                                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                                </button>
                            </>
                        )}
                    </form>
                ) : step === 'verification' ? (
                    <form onSubmit={handleVerificationSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Verification Code</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                {showDemoCode ? (
                                    <>Email service is offline. Use the demo code below (local testing).</>
                                ) : (
                                    <>
                                        A 6-digit {isResetting ? 'reset ' : ''}code has been sent to{' '}
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{email}</span>
                                    </>
                                )}
                            </p>
                            {showDemoCode && (
                                <div className="p-3 mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                                            Demo code:{' '}
                                            <span className="font-bold tracking-widest text-amber-900 dark:text-amber-100">
                                                {generatedCode}
                                            </span>
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setVerificationCode(generatedCode);
                                                setError('');
                                            }}
                                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                        >
                                            Use code
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80 mt-1">
                                        Start the backend email service to send real emails.
                                    </p>
                                </div>
                            )}
                            <input
                                type="text"
                                required
                                value={verificationCode}
                                onChange={(e) => {
                                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                                    setError('');
                                }}
                                maxLength={6}
                                className="w-full p-4 text-center text-2xl font-bold letter-spacing tracking-widest border-2 border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
                                placeholder="000000"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm font-semibold text-red-600 dark:text-red-400">❌ {error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || verificationCode.length !== 6}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-indigo-300 dark:hover:shadow-indigo-900 transition-all shadow-md disabled:opacity-50"
                        >
                            {isLoading ? 'Verifying...' : isResetting ? 'Continue' : isSignUp ? 'Create Account' : 'Sign In'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setStep('credentials');
                                setVerificationCode('');
                                setError('');
                                setShowDemoCode(false);
                            }}
                            className="w-full text-indigo-600 dark:text-indigo-400 py-2 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                            ← Back
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-white rounded-lg opacity-75 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setError('');
                                }}
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimum 6 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                required
                                value={newConfirmPassword}
                                onChange={(e) => {
                                    setNewConfirmPassword(e.target.value);
                                    setError('');
                                }}
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm font-semibold text-red-600 dark:text-red-400">❌ {error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-indigo-300 dark:hover:shadow-indigo-900 transition-all shadow-md disabled:opacity-50"
                        >
                            {isLoading ? 'Updating...' : 'Update Password'}
                        </button>

                        <button
                            type="button"
                            onClick={cancelResetFlow}
                            className="w-full text-indigo-600 dark:text-indigo-400 py-2 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                            ← Back to Sign In
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

const InquiryPage: React.FC<{ user: User | null }> = ({ user }) => {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', service: 'Income Tax', message: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newInquiry: Inquiry = {
            id: Math.random().toString(36).substr(2, 9),
            userId: user?.email,
            ...formData,
            timestamp: Date.now(),
            status: 'pending'
        };
        const existing = JSON.parse(localStorage.getItem('tax_inquiries') || '[]');
        localStorage.setItem('tax_inquiries', JSON.stringify([...existing, newInquiry]));
        scheduleLocalDataSync();
        setSubmitted(true);
    };

    if (!user) {
        return (
            <div className="max-w-2xl mx-auto py-20 px-4 text-center">
                <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🔒</div>
                <h2 className="text-3xl font-bold mb-4 text-slate-900">Sign In to Consult</h2>
                <p className="text-slate-600 mb-8 text-lg">To provide personalized tax advice and protect your privacy, we require users to be signed in before booking a free consultation.</p>
                <Link to="/login" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all inline-block">
                    Go to Sign In
                </Link>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center">
                <div className="text-6xl mb-6">✅</div>
                <h2 className="text-3xl font-bold mb-4">Inquiry Received!</h2>
                <p className="text-slate-600 mb-8">Thank you for reaching out. One of our experts will contact you at {user.email} within 24 business hours.</p>
                <button onClick={() => setSubmitted(false)} className="text-indigo-600 font-bold underline">Send another message</button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-16">
            <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">Expert Tax Help is <br /><span className="text-indigo-600">Just One Message Away.</span></h2>
                <p className="text-lg text-slate-600 mb-8">
                    Hi {user.name}, fill out the form and we'll analyze your needs. Your details are securely linked to your profile for faster processing.
                </p>
                <div className="space-y-6">
                    <div className="flex gap-4 items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl shrink-0">📍</div>
                        <div>
                            <h4 className="font-bold">Main Office</h4>
                            <p className="text-slate-500 text-sm">Nariman Point, Mumbai, MH - 400021</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl shrink-0">📞</div>
                        <div>
                            <h4 className="font-bold">Call Us</h4>
                            <p className="text-slate-500 text-sm">+91 22 4567 8900</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                            <input type="email" readOnly value={user.email} className="w-full p-3 border border-slate-200 rounded-lg outline-none bg-slate-100 text-slate-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Service Required</label>
                        <select value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg outline-none">
                            <option>Income Tax</option>
                            <option>GST Compliance</option>
                            <option>TDS Returns</option>
                            <option>Tax Audit</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
                        <textarea rows={4} required value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg outline-none" placeholder="Tell us about your requirements..." />
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
                        Send Inquiry
                    </button>
                </form>
            </div>
        </div>
    );
};

const CalculatorHub: React.FC<{ user: User | null }> = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [toolPrefs, setToolPrefs] = useState(() => getToolPreferences());

    const [category, setCategory] = useState<ToolCategoryId>(() => toolPrefs.lastSelection?.category ?? 'TAX');
    const [subTool, setSubTool] = useState<string>(() => {
        const cat = toolPrefs.lastSelection?.category ?? 'TAX';
        const requested = toolPrefs.lastSelection?.toolId;
        const tools = CALCULATORS[cat];
        if (requested && tools.some((t) => t.id === requested)) return requested;
        return tools[0]?.id || 'IT';
    });
    const [toolQuery, setToolQuery] = useState('');
    const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);

    const onSave = (calc: SavedCalculation) => {
        const existing = JSON.parse(localStorage.getItem('tax_saved_calcs') || '[]');
        const enriched = user ? { ...calc, userEmail: user.email } : calc;
        localStorage.setItem('tax_saved_calcs', JSON.stringify([...existing, enriched]));
        scheduleLocalDataSync();
        toast.success('Calculation saved successfully to your records!');
        if (user) logActivity(user, 'SAVE_CALCULATION', `${enriched.type}: ${enriched.label}`);
    };

    React.useEffect(() => {
        setToolPrefs(recordToolUsage({ category, toolId: subTool }));
    }, [category, subTool]);

    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const cat = params.get('cat');
        const tool = params.get('tool');
        if (!cat && !tool) return;

        const nextCat = (cat === 'TAX' || cat === 'INVEST' || cat === 'LOAN' ? (cat as ToolCategoryId) : category) as ToolCategoryId;
        const nextTools = CALCULATORS[nextCat];
        const nextTool = tool && nextTools.some((t) => t.id === tool) ? tool : nextTools[0]?.id;

        if (nextCat !== category) setCategory(nextCat);
        if (nextTool && nextTool !== subTool) setSubTool(nextTool);
        if (isToolMenuOpen) setIsToolMenuOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    const handleCategoryChange = (catId: ToolCategoryId) => {
        const nextTool = CALCULATORS[catId][0].id;
        setCategory(catId);
        setSubTool(nextTool);
        setToolQuery('');
        setIsToolMenuOpen(false);
        navigate(`/calculators?cat=${encodeURIComponent(catId)}&tool=${encodeURIComponent(nextTool)}`, { replace: true });
    };

    const tools = CALCULATORS[category];

    const ActiveCalculator = tools.find(c => c.id === subTool)?.component;
    const activeToolLabel = tools.find((t) => t.id === subTool)?.label || 'Select tool';

    const favoriteTools = useMemo(() => {
        const prefix = `${category}:`;
        const byId = new Map(tools.map((t) => [t.id, t] as const));
        return toolPrefs.favorites
            .filter((k) => k.startsWith(prefix))
            .map((k) => k.slice(prefix.length))
            .filter((id) => byId.has(id))
            .map((id) => byId.get(id)!);
    }, [category, tools, toolPrefs.favorites]);

    const recentTools = useMemo(() => {
        const prefix = `${category}:`;
        const byId = new Map(tools.map((t) => [t.id, t] as const));
        const favoriteIds = new Set(favoriteTools.map((t) => t.id));
        return toolPrefs.recents
            .filter((k) => k.startsWith(prefix))
            .map((k) => k.slice(prefix.length))
            .filter((id) => byId.has(id) && !favoriteIds.has(id))
            .map((id) => byId.get(id)!);
    }, [category, tools, toolPrefs.recents, favoriteTools]);

    const remainingTools = useMemo(() => {
        const excluded = new Set([...favoriteTools.map((t) => t.id), ...recentTools.map((t) => t.id)]);
        return tools.filter((t) => !excluded.has(t.id));
    }, [tools, favoriteTools, recentTools]);

    const filteredTools = useMemo(() => {
        const q = toolQuery.trim().toLowerCase();
        if (!q) return tools;
        return tools.filter((t) => t.label.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }, [toolQuery, tools]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Expert Financial Calculators</h1>
                <p className="text-slate-600">Professional-grade tools built to handle complex Indian regulations with ease.</p>
            </div>

            <div className="flex flex-col gap-8">
                <div className="flex flex-wrap justify-center gap-4">
                    {CALCULATOR_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id as ToolCategoryId)}
                            className={`px-8 py-3 rounded-2xl text-sm font-black flex items-center gap-2 transition-all ${category === cat.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-white border border-slate-100 text-slate-500 hover:border-indigo-400'
                                }`}
                        >
                            <span>{cat.icon}</span> {cat.label}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm h-fit">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Tool</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {tools.length} tools
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsToolMenuOpen((v) => !v)}
                            className="mt-4 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-black text-sm hover:border-indigo-400 transition-all"
                            aria-label="Toggle tool menu"
                        >
                            <span className="truncate">{activeToolLabel}</span>
                            <svg
                                className={`w-4 h-4 transition-transform ${isToolMenuOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isToolMenuOpen && (
                            <div className="mt-4 space-y-3">
                                <input
                                    value={toolQuery}
                                    onChange={(e) => setToolQuery(e.target.value)}
                                    placeholder="Search tools..."
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                />
                                <div className="flex flex-col gap-2 max-h-[65vh] overflow-y-auto pr-1">
                                    {(toolQuery.trim() ? filteredTools : [...favoriteTools, ...recentTools, ...remainingTools]).map((tool, idx) => {
                                        const isFavorite = toolPrefs.favorites.includes(makeToolKey(category, tool.id));
                                        const isSelected = subTool === tool.id;
                                        const showFavoritesHeader = !toolQuery.trim() && idx === 0 && favoriteTools.length > 0;
                                        const showRecentHeader =
                                            !toolQuery.trim() && idx === favoriteTools.length && recentTools.length > 0;
                                        const showAllHeader =
                                            !toolQuery.trim() &&
                                            idx === favoriteTools.length + recentTools.length &&
                                            remainingTools.length > 0;

                                        return (
                                            <React.Fragment key={tool.id}>
                                                {showFavoritesHeader && (
                                                    <div className="flex items-center justify-between pt-1 pb-2">
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            Favorites
                                                        </div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            {favoriteTools.length}
                                                        </div>
                                                    </div>
                                                )}
                                                {showRecentHeader && (
                                                    <div className="flex items-center justify-between pt-4 pb-2">
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            Recent
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setToolPrefs(clearRecentTools())}
                                                            className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700"
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                )}
                                                {showAllHeader && (
                                                    <div className="pt-4 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        All tools
                                                    </div>
                                                )}

                                                <div
                                                    className={`flex items-stretch rounded-xl border transition-colors ${
                                                        isSelected
                                                            ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-900/40'
                                                            : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSubTool(tool.id);
                                                            setToolQuery('');
                                                            setIsToolMenuOpen(false);
                                                            navigate(
                                                                `/calculators?cat=${encodeURIComponent(category)}&tool=${encodeURIComponent(
                                                                    tool.id
                                                                )}`,
                                                                { replace: true }
                                                            );
                                                        }}
                                                        className={`flex-1 text-left px-4 py-3 text-sm font-bold rounded-xl ${
                                                            isSelected
                                                                ? 'text-indigo-700 dark:text-indigo-200'
                                                                : 'text-slate-600 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {tool.label}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setToolPrefs(toggleFavoriteTool(makeToolKey(category, tool.id)))
                                                        }
                                                        className={`px-3 rounded-xl text-sm font-black transition-colors ${
                                                            isFavorite
                                                                ? 'text-amber-500 hover:text-amber-600'
                                                                : 'text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300'
                                                        }`}
                                                        aria-label={isFavorite ? 'Unfavorite tool' : 'Favorite tool'}
                                                        title={isFavorite ? 'Unfavorite' : 'Favorite'}
                                                    >
                                                        {isFavorite ? '★' : '☆'}
                                                    </button>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                    {filteredTools.length === 0 && (
                                        <div className="py-6 text-center text-sm font-bold text-slate-400">
                                            No tools match your search.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-3">
                        <Suspense fallback={<div>Loading...</div>}>
                            {ActiveCalculator && <ActiveCalculator user={user} onSave={onSave} />}
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface AppRouterProps {
    user: User | null;
}

const AppRouter: React.FC<AppRouterProps> = ({ user }) => {
    React.useEffect(() => {
        scheduleLocalDataSync(200);
    }, []);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route path="/dashboard/client" element={<ClientDashboard user={user} />} />
                <Route path="/dashboard/employee" element={<EmployeeDashboard user={user} />} />
                <Route path="/dashboard/admin" element={<AdminDashboardMaster user={user} />} />
                <Route path="/services" element={<InquiryPage user={user} />} />
                <Route path="/calculators" element={<CalculatorHub user={user} />} />
                <Route path="/visualizer" element={<Visualizer />} />
                <Route path="/news" element={<TaxNews />} />
                <Route path="/resources" element={<UsefulLinks />} />
                <Route path="/records" element={<MyRecords user={user} />} />
                <Route path="/profile" element={<Profile user={user} />} />
                <Route path="/cases" element={<Cases user={user} />} />
                <Route path="/cases/:caseId" element={<CaseDetails user={user} />} />
                <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                <Route
                    path="/admin"
                    element={String(user?.role || '').toLowerCase() === 'admin' ? <AdminDashboardMaster user={user} /> : <Navigate to="/login" />}
                />
                <Route
                    path="/admin/users"
                    element={String(user?.role || '').toLowerCase() === 'admin' ? <AdminUsers user={user} /> : <Navigate to="/login" />}
                />
                <Route
                    path="/admin/legacy"
                    element={String(user?.role || '').toLowerCase() === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

export default AppRouter;
