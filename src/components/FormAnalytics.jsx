import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export default function FormAnalytics({ formId }) {
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalSubmissions: 0,
    conversionRate: 0,
    averageCompletionTime: 0,
    dropOffPoints: [],
    deviceBreakdown: {},
    submissionTrends: [],
    fieldAnalytics: {}
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    loadAnalytics();
  }, [formId, timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAnalytics = async () => {
    if (!formId) return;
    
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24hours':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      // Fetch form submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', formId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (submissionsError) throw submissionsError;

      // Calculate analytics
      const totalSubmissions = submissions?.length || 0;
      
      // Mock data for views (in real app, you'd track this)
      const totalViews = Math.max(totalSubmissions * (2 + Math.random() * 3), totalSubmissions);
      const conversionRate = totalViews > 0 ? (totalSubmissions / totalViews * 100) : 0;

      // Calculate average completion time (mock data)
      const averageCompletionTime = 2 + Math.random() * 8; // 2-10 minutes

      // Device breakdown (mock data)
      const deviceBreakdown = {
        desktop: Math.floor(totalSubmissions * 0.6),
        mobile: Math.floor(totalSubmissions * 0.3),
        tablet: Math.floor(totalSubmissions * 0.1)
      };

      // Submission trends
      const submissionTrends = generateSubmissionTrends(submissions, startDate, endDate);

      // Field analytics
      const fieldAnalytics = generateFieldAnalytics(submissions);

      setAnalytics({
        totalViews: Math.round(totalViews),
        totalSubmissions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
        dropOffPoints: generateDropOffPoints(),
        deviceBreakdown,
        submissionTrends,
        fieldAnalytics
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSubmissionTrends = (submissions, startDate, endDate) => {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const trends = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const daySubmissions = submissions.filter(sub => {
        const subDate = new Date(sub.created_at);
        return subDate.toDateString() === date.toDateString();
      }).length;

      trends.push({
        date: date.toISOString().split('T')[0],
        submissions: daySubmissions
      });
    }

    return trends;
  };

  const generateFieldAnalytics = (submissions) => {
    const fieldStats = {};
    
    submissions.forEach(submission => {
      try {
        const data = typeof submission.form_data === 'string' 
          ? JSON.parse(submission.form_data) 
          : submission.form_data;
        
        Object.keys(data).forEach(fieldKey => {
          if (!fieldStats[fieldKey]) {
            fieldStats[fieldKey] = {
              totalResponses: 0,
              uniqueValues: new Set(),
              mostCommonValue: null,
              averageLength: 0
            };
          }
          
          fieldStats[fieldKey].totalResponses++;
          fieldStats[fieldKey].uniqueValues.add(data[fieldKey]);
          
          if (typeof data[fieldKey] === 'string') {
            fieldStats[fieldKey].averageLength += data[fieldKey].length;
          }
        });
      } catch (error) {
        console.error('Error parsing submission data:', error);
      }
    });

    // Calculate averages and most common values
    Object.keys(fieldStats).forEach(fieldKey => {
      const stat = fieldStats[fieldKey];
      stat.averageLength = Math.round(stat.averageLength / stat.totalResponses);
      stat.uniqueValues = stat.uniqueValues.size;
    });

    return fieldStats;
  };

  const generateDropOffPoints = () => {
    // Mock drop-off data
    return [
      { fieldName: 'Email Address', dropOffRate: 15 },
      { fieldName: 'Phone Number', dropOffRate: 25 },
      { fieldName: 'Company Details', dropOffRate: 35 },
      { fieldName: 'Additional Comments', dropOffRate: 20 }
    ];
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Form Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="24hours">Last 24 Hours</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.conversionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.averageCompletionTime}m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Trends */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Submission Trends</h3>
          <div className="space-y-3">
            {analytics.submissionTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{new Date(trend.date).toLocaleDateString()}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.max((trend.submissions / Math.max(...analytics.submissionTrends.map(t => t.submissions), 1)) * 100, 5)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{trend.submissions}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Device Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(analytics.deviceBreakdown).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    device === 'desktop' ? 'bg-blue-100' :
                    device === 'mobile' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    {device === 'desktop' && (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {device === 'mobile' && (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
                      </svg>
                    )}
                    {device === 'tablet' && (
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{device}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                  <span className="text-xs text-gray-500">
                    ({analytics.totalSubmissions > 0 ? Math.round((count / analytics.totalSubmissions) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drop-off Analysis */}
      {analytics.dropOffPoints.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Drop-off Analysis</h3>
          <p className="text-sm text-gray-600 mb-4">
            Fields where users are most likely to abandon the form
          </p>
          <div className="space-y-3">
            {analytics.dropOffPoints.map((point, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{point.fieldName}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${point.dropOffRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-red-600 w-12">{point.dropOffRate}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Tip:</strong> Consider making high drop-off fields optional or adding help text to improve completion rates.
            </p>
          </div>
        </div>
      )}

      {/* Field Analytics */}
      {Object.keys(analytics.fieldAnalytics).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Field Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unique Values
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Length
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(analytics.fieldAnalytics).map(([fieldKey, stats]) => (
                  <tr key={fieldKey}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {fieldKey}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stats.totalResponses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stats.uniqueValues}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stats.averageLength} chars
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
