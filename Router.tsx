import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { User, Inquiry, SavedCalculation } from './types';
import { useUserStore } from './store/userStore';
import toast from 'react-hot-toast';
import { sendVerificationCode } from './services/emailService';
import { CALCULATOR_CATEGORIES, CALCULATORS } from './config/calculators';
import { logActivity } from './services/activityService';

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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState<'credentials' | 'verification'>('credentials');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const login = useUserStore((state) => state.login);

    // Email validation
    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Password validation (min 6 characters)
    const isValidPassword = (password: string) => {
        return password.length >= 6;
    };

    // Check if email already exists
    const emailExists = (email: string) => {
        const users = JSON.parse(localStorage.getItem('quickaccounting_users') || '[]');
        return users.some((user: any) => user.email === email);
    };

    // Save new user
    const saveNewUser = (userData: any) => {
        const users = JSON.parse(localStorage.getItem('quickaccounting_users') || '[]');
        users.push(userData);
        localStorage.setItem('quickaccounting_users', JSON.stringify(users));
    };

    // Find user for login
    const findUser = (email: string, password: string) => {
        const users = JSON.parse(localStorage.getItem('quickaccounting_users') || '[]');
        return users.find((user: any) => user.email === email && user.password === password);
    };

    const handleSignUpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Validations
        if (!fullName.trim()) {
            setError('Please enter your full name');
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
                    toast.success(`Verification code sent to ${email}`);
                } else {
                    toast.error('Email service unavailable. Please try again later.');
                }
                setStep('verification');
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

        // Check if user exists with correct credentials
        const user = findUser(email, password);
        if (!user) {
            setError('Invalid email or password. Please try again.');
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
                    toast.success(`Verification code sent to ${email}`);
                } else {
                    toast.error('Email service unavailable. Please try again later.');
                }
                setStep('verification');
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

        setTimeout(() => {
            if (isSignUp) {
                // Register new user
                const newUser = {
                    email,
                    password,
                    name: fullName,
                    role: 'user',
                    createdAt: Date.now()
                };
                saveNewUser(newUser);
                login({ email, name: fullName, role: 'user' });
                toast.success('Account created successfully!');
            } else {
                // Sign in existing user
                const user = findUser(email, password);
                if (user) {
                    login({ email, name: user.name, role: user.role });
                    toast.success('Login successful!');
                } else {
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
                    {step === 'credentials' ? (isSignUp ? 'Create Account' : 'Welcome Back') : 'Verify Your Identity'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    {step === 'credentials' 
                        ? (isSignUp ? 'Join Quick Accounting Service today' : 'Sign in to manage your profile')
                        : 'Enter the verification code sent to your email'}
                </p>

                {step === 'credentials' ? (
                    <form onSubmit={isSignUp ? handleSignUpSubmit : handleSignInSubmit} className="space-y-6">
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => {
                                        setFullName(e.target.value);
                                        setError('');
                                    }}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
                                    placeholder="Your full name"
                                />
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

                        {isSignUp && (
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
                            {isLoading ? 'Verifying...' : isSignUp ? 'Create Account' : 'Sign In'}
                        </button>

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
                                setIsSignUp(!isSignUp);
                                setError('');
                                setEmail('');
                                setPassword('');
                                setConfirmPassword('');
                                setFullName('');
                            }}
                            className="w-full text-indigo-600 dark:text-indigo-400 py-2 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerificationSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Verification Code</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">A 6-digit code has been sent to <span className="font-bold text-slate-700 dark:text-slate-300">{email}</span></p>
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
                            {isLoading ? 'Verifying...' : isSignUp ? 'Create Account' : 'Sign In'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setStep('credentials');
                                setVerificationCode('');
                                setError('');
                            }}
                            className="w-full text-indigo-600 dark:text-indigo-400 py-2 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                            ← Back
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
    const [category, setCategory] = useState<'TAX' | 'INVEST' | 'LOAN'>('TAX');
    const [subTool, setSubTool] = useState<string>('IT');

    const onSave = (calc: SavedCalculation) => {
        const existing = JSON.parse(localStorage.getItem('tax_saved_calcs') || '[]');
        const enriched = user ? { ...calc, userEmail: user.email } : calc;
        localStorage.setItem('tax_saved_calcs', JSON.stringify([...existing, enriched]));
        toast.success('Calculation saved successfully to your records!');
        if (user) logActivity(user, 'SAVE_CALCULATION', `${enriched.type}: ${enriched.label}`);
    };

    const handleCategoryChange = (catId: 'TAX' | 'INVEST' | 'LOAN') => {
        setCategory(catId);
        setSubTool(CALCULATORS[catId][0].id);
    };

    const ActiveCalculator = CALCULATORS[category].find(c => c.id === subTool)?.component;

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
                            onClick={() => handleCategoryChange(cat.id as any)}
                            className={`px-8 py-3 rounded-2xl text-sm font-black flex items-center gap-2 transition-all ${category === cat.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-white border border-slate-100 text-slate-500 hover:border-indigo-400'
                                }`}
                        >
                            <span>{cat.icon}</span> {cat.label}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-fit">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Select Tool</p>
                        <div className="flex flex-col gap-2">
                            {CALCULATORS[category].map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => setSubTool(tool.id)}
                                    className={`text-left px-4 py-3 rounded-xl text-sm font-bold ${subTool === tool.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {tool.label}
                                </button>
                            ))}
                        </div>
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
                <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboardMaster user={user} /> : <Navigate to="/login" />} />
                <Route path="/admin/users" element={user?.role === 'admin' ? <AdminUsers user={user} /> : <Navigate to="/login" />} />
                <Route path="/admin/legacy" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
            </Routes>
        </Suspense>
    );
};

export default AppRouter;
