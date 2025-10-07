import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { FaCalendarAlt, FaUsers, FaWrench, FaDollarSign, FaArrowUp, FaClock, FaSync } from 'react-icons/fa';
import api from '../api/client';

const BookingAnalytics = ({ useMockData = true }) => {
  const [analyticsData, setAnalyticsData] = useState({
    dailyBookings: [],
    serviceTypes: [],
    monthlyStats: {
      totalBookings: 0,
      totalRevenue: 0,
      avgRating: 0,
      activeMechanics: 0
    },
    loading: true,
    lastUpdated: null
  });
  const [refreshing, setRefreshing] = useState(false);



  // Function to fetch analytics data
  const fetchAnalytics = async (isRefresh = false) => {
    if (useMockData) {
      // For homepage, use empty data (no dummy values)
      setAnalyticsData(prev => ({
        dailyBookings: [],
        serviceTypes: [],
        monthlyStats: {
          totalBookings: 0,
          totalRevenue: 0,
          avgRating: 0,
          activeMechanics: 0
        },
        loading: false,
        lastUpdated: new Date()
      }));
    } else {
      // Fetch real system-wide analytics data
      try {
        if (isRefresh) setRefreshing(true);
        const response = await api.get('/api/analytics/bookings?period=all');
        const data = response.data;

        setAnalyticsData({
          ...data,
          loading: false,
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error('❌ Error fetching analytics:', error);
        console.error('Error details:', error.response?.data || error.message);
        // Fallback to empty data (no dummy values)
        setAnalyticsData({
          dailyBookings: [],
          serviceTypes: [],
          monthlyStats: {
            totalBookings: 0,
            totalRevenue: 0,
            avgRating: 0,
            activeMechanics: 0
          },
          loading: false,
          lastUpdated: new Date()
        });
      } finally {
        if (isRefresh) setRefreshing(false);
      }
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  // Load data based on useMockData prop
  useEffect(() => {
    fetchAnalytics();
  }, [useMockData]);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    if (!useMockData) {
      const interval = setInterval(() => {
        fetchAnalytics(true);
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    }
  }, [useMockData]);

  if (analyticsData.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-3xl font-bold text-primary">{analyticsData.monthlyStats.totalBookings}</p>
            </div>
            <FaCalendarAlt className="h-8 w-8 text-primary" />
          </div>
          <div className="flex items-center text-sm text-green-500">
            <FaCalendarAlt className="h-4 w-4 mr-1" />
            All time data
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Active Mechanics</p>
              <p className="text-3xl font-bold text-primary">{analyticsData.monthlyStats.activeMechanics}</p>
            </div>
            <FaWrench className="h-8 w-8 text-primary" />
          </div>
          <div className="flex items-center text-sm text-green-500">
            <FaClock className="h-4 w-4 mr-1" />
            Online now
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer Rating</p>
              <p className="text-3xl font-bold text-accent">{analyticsData.monthlyStats.avgRating}/5</p>
            </div>
            <FaUsers className="h-8 w-8 text-accent" />
          </div>
          <div className="flex items-center text-sm text-green-500">
            <FaArrowUp className="h-4 w-4 mr-1" />
            Excellent service
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Bookings Trend */}
        <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Bookings Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.dailyBookings}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="bookings" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Service Types Distribution */}
        <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Popular Services</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.serviceTypes}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="service" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Enhanced Service Distribution */}
      <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Service Distribution</h3>
            {analyticsData.lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Last updated: {analyticsData.lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
            >
              <FaSync className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs bg-primary/20 text-primary rounded-lg">All Services</button>
              <button className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-lg">By Category</button>
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.serviceTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.serviceTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-primary">{data.service}</p>
                          <p className="text-sm text-muted-foreground">Category: {data.category}</p>
                          <p className="text-sm">Bookings: {data.count}</p>
                          <p className="text-sm">Avg Price: ${data.avgPrice}</p>
                          <p className="text-sm">Avg Time: {data.avgTime}</p>
                          <p className="text-sm text-green-500">Trend: {data.trend}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Service Details List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground mb-3">Service Details</h4>
            {analyticsData.serviceTypes.slice(0, 6).map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: service.color }}
                  />
                  <div>
                    <p className="font-medium text-sm">{service.service}</p>
                    <p className="text-xs text-muted-foreground">{service.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{service.count} bookings</p>
                  <p className="text-xs text-green-500">{service.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingAnalytics;
