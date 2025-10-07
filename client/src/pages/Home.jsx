import React, { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const heroImage = "/assets/car_bck.jpg";

const services = [
  {
    title: "Engine Diagnostics",
    description: "Complete engine analysis with advanced diagnostic tools.",
    price: "99",
    duration: "45 min",
    rating: 4.9,
    category: "Engine",
    popular: true,
  },
  {
    title: "Brake Service",
    description: "Professional brake inspection, repair, and replacement.",
    price: "75",
    duration: "30 min",
    rating: 4.8,
    category: "Safety",
  },
  {
    title: "Oil Change Plus",
    description: "Premium oil change with multi-point inspection.",
    price: "45",
    duration: "20 min",
    rating: 4.7,
    category: "Maintenance",
  },
  {
    title: "Tire Service",
    description: "Tire rotation, balancing, and replacement services.",
    price: "65",
    duration: "35 min",
    rating: 4.8,
    category: "Tires",
  },
  {
    title: "AC Repair",
    description: "Air conditioning diagnosis and repair services.",
    price: "85",
    duration: "60 min",
    rating: 4.6,
    category: "Comfort",
  },
  {
    title: "Transmission Service",
    description: "Transmission fluid change and system maintenance.",
    price: "120",
    duration: "90 min",
    rating: 4.9,
    category: "Drivetrain",
  },
];

// Modern color palette matching inventory dashboard
const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  purple: '#A855F7',
  pink: '#EC4899',
  cyan: '#06B6D4',
};

function getAvailabilityColor(status) {
  switch (status) {
    case "available": return "bg-emerald-500";
    case "busy": return "bg-amber-500";
    case "offline": return "bg-slate-500";
    default: return "bg-slate-500";
  }
}

function getAvailabilityText(status) {
  switch (status) {
    case "available": return "Available Now";
    case "busy": return "Busy";
    case "offline": return "Offline";
    default: return "Unknown";
  }
}

// Mock analytics data
const mockAnalyticsData = {
  dailyBookings: [
    { day: 'Mon', bookings: 12 },
    { day: 'Tue', bookings: 19 },
    { day: 'Wed', bookings: 15 },
    { day: 'Thu', bookings: 25 },
    { day: 'Fri', bookings: 22 },
    { day: 'Sat', bookings: 30 },
    { day: 'Sun', bookings: 18 }
  ],
  popularServices: [
    { name: 'Oil Change', count: 145 },
    { name: 'Diagnostics', count: 132 },
    { name: 'Brake Service', count: 98 },
    { name: 'Tire Service', count: 87 }
  ],
  serviceDistribution: [
    { name: 'Oil Change', value: 145, color: '#10B981' },
    { name: 'Diagnostics', value: 132, color: '#6366F1' },
    { name: 'Brake Service', value: 98, color: '#EF4444' },
    { name: 'Tire Service', value: 87, color: '#8B5CF6' },
    { name: 'AC Repair', value: 65, color: '#EC4899' }
  ],
  stats: {
    totalBookings: 1247,
    activeBookings: 23,
    completedBookings: 1224,
    revenue: 257000,
    avgRating: 4.8
  }
};

function BookingAnalytics() {
  const [analyticsData, setAnalyticsData] = useState({
    dailyBookings: [],
    popularServices: [],
    serviceDistribution: [],
    stats: {
      totalBookings: 0,
      activeBookings: 0,
      completedBookings: 0,
      revenue: 0,
      avgRating: 0,
      activeMechanics: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        console.log('Fetching analytics data...');

        // Use native fetch API with proper content-type checking
        const response = await fetch('/api/analytics/bookings', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          console.log('Parsed JSON data:', data);
        } else {
          const textData = await response.text();
          console.error('Received non-JSON response from API:', textData);
          throw new Error('Invalid data structure received from API. Expected JSON object.');
        }

        console.log('Full API response status:', response.status);
        console.log('Response data type:', typeof data);

        // Handle different possible response formats
        let validatedData = {
          dailyBookings: [],
          popularServices: [],
          serviceDistribution: [],
          stats: {
            totalBookings: 0,
            activeBookings: 0,
            completedBookings: 0,
            revenue: 0,
            avgRating: 0,
            activeMechanics: 0
          }
        };

        // Check if data exists and is an object
        if (data && typeof data === 'object') {
          // Handle dailyBookings - could be under different property names
          if (Array.isArray(data.dailyBookings)) {
            validatedData.dailyBookings = data.dailyBookings;
          } else if (Array.isArray(data.bookings)) {
            validatedData.dailyBookings = data.bookings;
          } else if (data.dailyBookings && typeof data.dailyBookings === 'object') {
            // Convert object to array if needed
            validatedData.dailyBookings = Object.values(data.dailyBookings);
          }

          // Handle popularServices
          if (Array.isArray(data.popularServices)) {
            validatedData.popularServices = data.popularServices;
          } else if (Array.isArray(data.services)) {
            validatedData.popularServices = data.services;
          } else if (data.popularServices && typeof data.popularServices === 'object') {
            validatedData.popularServices = Object.values(data.popularServices);
          }

          // Handle serviceDistribution
          if (Array.isArray(data.serviceDistribution)) {
            validatedData.serviceDistribution = data.serviceDistribution;
          } else if (Array.isArray(data.distribution)) {
            validatedData.serviceDistribution = data.distribution;
          } else if (data.serviceDistribution && typeof data.serviceDistribution === 'object') {
            validatedData.serviceDistribution = Object.values(data.serviceDistribution);
          }

          // Handle stats
          if (data.stats && typeof data.stats === 'object') {
            validatedData.stats = { ...validatedData.stats, ...data.stats };
          } else if (data.totalBookings !== undefined) {
            // Handle flat response structure
            validatedData.stats = {
              totalBookings: data.totalBookings || 0,
              activeBookings: data.activeBookings || 0,
              completedBookings: data.completedBookings || 0,
              revenue: data.revenue || 0,
              avgRating: data.avgRating || 0,
              activeMechanics: data.activeMechanics || 0
            };
          }

          console.log('Validated data structure:', validatedData);
          setAnalyticsData(validatedData);
          setError(null);
          console.log('Analytics data loaded successfully');
        } else {
          console.warn('API returned non-object data:', data);
          throw new Error(`Invalid data structure received from API. Expected object, got ${typeof data}`);
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        // Use fallback data when API call fails
        setAnalyticsData({
          dailyBookings: [
            { day: 'Mon', bookings: 0 },
            { day: 'Tue', bookings: 0 },
            { day: 'Wed', bookings: 0 },
            { day: 'Thu', bookings: 0 },
            { day: 'Fri', bookings: 0 },
            { day: 'Sat', bookings: 0 },
            { day: 'Sun', bookings: 0 }
          ],
          popularServices: [
            { name: 'No Data', count: 0 }
          ],
          serviceDistribution: [
            { name: 'No Data', value: 1, color: '#94a3b8' }
          ],
          stats: {
            totalBookings: 0,
            activeBookings: 0,
            completedBookings: 0,
            revenue: 0,
            avgRating: 0,
            activeMechanics: 0
          }
        });
        setError(`Failed to load analytics: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        <span className="ml-4 text-slate-300 font-medium">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-white font-medium">{error || 'Failed to load analytics data'}</p>
          <p className="text-slate-400 text-sm mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-xl shadow-2xl p-4">
          <p className="font-semibold text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/20 px-3 py-1 rounded-full">+12%</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{analyticsData.stats?.totalBookings?.toLocaleString()}</h3>
          <p className="text-sm text-indigo-300 font-medium">Total Bookings</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full">Live</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{analyticsData.stats?.activeMechanics?.toLocaleString()}</h3>
          <p className="text-sm text-emerald-300 font-medium">Active Mechanics</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.07-1.371-1.81-.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full">{analyticsData.stats?.avgRating}/5</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{analyticsData.stats?.avgRating}/5</h3>
          <p className="text-sm text-amber-300 font-medium">Customer Rating</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Bookings Trend */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-8 shadow-2xl hover:shadow-indigo-500/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Daily Bookings Trend</h3>
              <p className="text-sm text-slate-400">Weekly performance overview</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.dailyBookings}>
              <defs>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
              <XAxis
                dataKey="day"
                stroke="#94a3b8"
                style={{ fontSize: '12px', fontWeight: '500' }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px', fontWeight: '500' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#6366F1"
                strokeWidth={3}
                dot={{ fill: '#6366F1', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, strokeWidth: 2 }}
                fill="url(#colorBookings)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Popular Services */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-8 shadow-2xl hover:shadow-purple-500/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Popular Services</h3>
              <p className="text-sm text-slate-400">Top performing services</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.popularServices}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#A855F7" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                style={{ fontSize: '11px', fontWeight: '500' }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px', fontWeight: '500' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="url(#barGradient)"
                radius={[12, 12, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Distribution */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Service Distribution</h3>
              <p className="text-sm text-slate-400">Breakdown by service type</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={analyticsData.serviceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {analyticsData.serviceDistribution?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {analyticsData.serviceDistribution?.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-700/40 backdrop-blur-sm rounded-xl p-3 min-w-[200px] border border-slate-600/30">
                  <div
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.value} bookings</p>
                  </div>
                  <span className="text-lg font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState("");
  const [fetchedMechanics, setFetchedMechanics] = useState([
    {
      id: "1",
      name: "John Smith",
      avatar: heroImage,
      rating: 4.9,
      distance: "2.3 km away",
      specialty: "Engine Specialist",
      price: "$85/hr",
      availability: "available",
      responseTime: "5-10 min",
      completedJobs: 247,
      phone: "+1 234 567 8900",
      email: "john@example.com"
    },
    {
      id: "2",
      name: "Sarah Johnson",
      avatar: heroImage,
      rating: 4.8,
      distance: "3.1 km away",
      specialty: "Brake Systems",
      price: "$75/hr",
      availability: "available",
      responseTime: "10-15 min",
      completedJobs: 189,
      phone: "+1 234 567 8901",
      email: "sarah@example.com"
    },
    {
      id: "3",
      name: "Mike Davis",
      avatar: heroImage,
      rating: 4.7,
      distance: "4.5 km away",
      specialty: "General Mechanic",
      price: "$70/hr",
      availability: "busy",
      responseTime: "15-20 min",
      completedJobs: 156,
      phone: "+1 234 567 8902",
      email: "mike@example.com"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-indigo-900/70" />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-indigo-300 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            Premium Auto Care
          </h2>
          <p className="text-xl md:text-2xl text-slate-200 mb-8 max-w-2xl mx-auto drop-shadow-lg font-light">
            Professional automotive services with certified mechanics available 24/7.
            Book instantly or find nearby help.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/find-mechanic')}
              className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 rounded-xl transition-all shadow-2xl hover:shadow-indigo-500/50 transform hover:scale-105 hover:-translate-y-1"
            >
              <svg className="inline w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Find Mechanic Now
            </button>
            <button
              onClick={() => navigate('/mechanic/signup')}
              className="px-8 py-4 text-lg font-semibold bg-transparent border-2 border-indigo-400/50 text-white hover:bg-indigo-500/20 hover:border-indigo-400 rounded-xl transition-all shadow-2xl transform hover:scale-105 hover:-translate-y-1 backdrop-blur-sm"
            >
              <svg className="inline w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
              Join as Mechanic
            </button>
            <button
              onClick={() => navigate('/book')}
              className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 rounded-xl transition-all shadow-2xl hover:shadow-emerald-500/50 transform hover:scale-105 hover:-translate-y-1"
            >
              <svg className="inline w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Make a Booking
            </button>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4 p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 border border-indigo-500/20 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg rotate-3 hover:rotate-0 transition-transform">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-white">Certified Mechanics</h3>
              <p className="text-slate-300 leading-relaxed">ASE certified professionals with proven expertise</p>
            </div>
            <div className="space-y-4 p-8 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-emerald-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg -rotate-3 hover:rotate-0 transition-transform">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-white">24/7 Service</h3>
              <p className="text-slate-300 leading-relaxed">Emergency support available around the clock</p>
            </div>
            <div className="space-y-4 p-8 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-amber-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg rotate-3 hover:rotate-0 transition-transform">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-white">Warranty Backed</h3>
              <p className="text-slate-300 leading-relaxed">All work guaranteed with comprehensive coverage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Real-Time Data
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Live Service Analytics
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto font-light">
              Real-time insights into our service operations and customer satisfaction
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <BookingAnalytics />
            </div>
          </div>
        </div>
      </section>

      {/* Mechanic Finder Section */}
      <section id="mechanics" className="py-16 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Find Mechanics Near You</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto font-light">
              Connect with certified mechanics in your area for immediate assistance
            </p>
          </div>
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
              <span className="ml-4 text-slate-300 font-medium">Finding mechanics...</span>
            </div>
          )}
          {!loading && fetchedMechanics.length === 0 && hasSearched && (
            <div className="text-center py-16 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-500/20">
              <svg className="h-20 w-20 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2 text-white">No Mechanics Found</h3>
              <p className="text-slate-400">No registered mechanics are available in your area right now.</p>
            </div>
          )}
          <div className="grid gap-8 md:grid-cols-3">
            {fetchedMechanics.map((mechanic) => (
              <div key={mechanic.id} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2 border border-indigo-500/20">
                <div className="relative mb-4">
                  <img src={mechanic.avatar} alt={mechanic.name} className="h-28 w-28 rounded-full border-4 border-indigo-500 object-cover shadow-xl" />
                  <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-slate-800 ${getAvailabilityColor(mechanic.availability)} shadow-lg`}></div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{mechanic.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="h-5 w-5 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold text-white text-lg">{mechanic.rating}</span>
                  <span className="text-sm text-slate-400">({mechanic.completedJobs} jobs)</span>
                </div>
                <div className="text-sm text-slate-300 mb-3 text-center font-medium">{mechanic.specialty}</div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-slate-300">{mechanic.distance}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${getAvailabilityColor(mechanic.availability)}`} />
                  <span className="text-sm font-semibold text-white">{getAvailabilityText(mechanic.availability)}</span>
                </div>
                <div className="flex items-center gap-2 mb-6">
                  <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-slate-300">Responds in {mechanic.responseTime}</span>
                </div>
                <div className="flex gap-3 w-full mt-auto">
                  <button className="flex-1 px-4 py-3 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 rounded-xl transition-all shadow-md hover:shadow-lg">
                    <svg className="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call
                  </button>
                  <button className="flex-1 px-4 py-3 text-sm font-semibold border-2 border-indigo-500/30 text-white hover:bg-indigo-500/20 rounded-xl transition-all">
                    <svg className="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">What Our Customers Say</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto font-light">
              Real feedback from satisfied customers who trust Auto Elite
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-slate-300 mb-4 leading-relaxed">
                "Excellent service! The mechanic arrived on time and fixed my car quickly. The pricing was transparent and fair."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  JS
                </div>
                <div>
                  <p className="font-semibold text-white">John Smith</p>
                  <p className="text-sm text-slate-400">Regular Customer</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-slate-300 mb-4 leading-relaxed">
                "The online booking system is so convenient. I can see nearby mechanics and their ratings before booking."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  MJ
                </div>
                <div>
                  <p className="font-semibold text-white">Maria Johnson</p>
                  <p className="text-sm text-slate-400">First-time User</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/20 transition-all hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-slate-300 mb-4 leading-relaxed">
                "Professional mechanics with great communication. They explained everything clearly and provided a warranty."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  DW
                </div>
                <div>
                  <p className="font-semibold text-white">David Wilson</p>
                  <p className="text-sm text-slate-400">Business Owner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">How It Works</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto font-light">
              Get professional automotive service in just 3 simple steps
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <div className="mb-4">
                <svg className="h-10 w-10 text-indigo-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Find Mechanics</h3>
              <p className="text-slate-300 leading-relaxed">
                Search for certified mechanics near your location with real-time availability
              </p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all hover:-translate-y-1">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl -rotate-3">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <div className="mb-4">
                <svg className="h-10 w-10 text-emerald-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Book Service</h3>
              <p className="text-slate-300 leading-relaxed">
                Choose your preferred mechanic and schedule a convenient time slot
              </p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/20 transition-all hover:-translate-y-1">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <div className="mb-4">
                <svg className="h-10 w-10 text-amber-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Get Service</h3>
              <p className="text-slate-300 leading-relaxed">
                Professional mechanic arrives at your location and completes the service
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-12 border-t border-indigo-500/20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4 text-left mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">Auto Elite</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">Professional automotive services with certified mechanics available 24/7.</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-indigo-300 mb-4">Services</h4>
              <ul className="space-y-3 text-slate-300">
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Engine Repair</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Brake Service</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Oil Changes</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Tire Service</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-indigo-300 mb-4">Company</h4>
              <ul className="space-y-3 text-slate-300">
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Careers</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Press</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Contact</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-indigo-300 mb-4">Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span>24/7 Emergency Services</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-indigo-500/20 pt-6 text-center text-slate-400">
            <p>&copy; 2024 Auto Elite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Badge({ color }) {
  return <span className={`inline-block w-3 h-3 rounded-full ${color}`} />;
}
