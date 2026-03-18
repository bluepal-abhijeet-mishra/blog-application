import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const EmptyChartState = ({ title }) => (
  <div className="h-[300px] rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-center px-6">
    <div>
      <p className="text-sm font-black text-slate-900 dark:text-white">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No data available yet.</p>
    </div>
  </div>
);

const AdminCharts = ({ stats, variant = 'platform' }) => {
  const userGrowth = Array.isArray(stats?.userGrowth) ? stats.userGrowth : [];
  const postActivity = Array.isArray(stats?.postActivity) ? stats.postActivity : [];
  const categoryData = Object.entries(stats?.categoryDistribution || {}).map(([name, value]) => ({ name, value }));
  const roleData = Object.entries(stats?.roleDistribution || {}).map(([name, value]) => ({ name, value }));

  const hasCategoryData = categoryData.some((item) => item.value > 0);
  const hasRoleData = roleData.some((item) => item.value > 0);
  const isAuthorVariant = variant === 'author';
  const lineSeriesLabel = isAuthorVariant ? 'New Drafts' : 'New Users';
  const trendTitle = isAuthorVariant ? 'Writing Trend' : 'User Growth Trend';
  const categoryTitle = isAuthorVariant ? 'Your Category Mix' : 'Category Distribution';
  const barTitle = isAuthorVariant ? 'Publishing Activity' : 'Monthly Publishing Activity';
  const roleTitle = isAuthorVariant ? 'Draft vs Published' : 'User Role Distribution';
  const emptyCategoryMessage = isAuthorVariant
    ? 'Category chart will appear after you assign categories to posts.'
    : 'Category chart will appear after published posts are categorized.';
  const emptyRoleMessage = isAuthorVariant
    ? 'Status distribution will appear once you create drafts or publish posts.'
    : 'Role distribution will appear after users are assigned roles.';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">{trendTitle}</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px -12px rgb(0 0 0 / 0.25)' }} />
              <Legend verticalAlign="top" height={36} />
              <Line
                name={lineSeriesLabel}
                type="monotone"
                dataKey="count"
                stroke={COLORS[0]}
                strokeWidth={3}
                dot={{ r: 3, fill: COLORS[0], strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">{categoryTitle}</h3>
        {hasCategoryData ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={86}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`category-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px -12px rgb(0 0 0 / 0.25)' }} />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChartState title={emptyCategoryMessage} />
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">{barTitle}</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={postActivity}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px -12px rgb(0 0 0 / 0.25)' }} />
              <Bar
                name="Published Posts"
                dataKey="count"
                fill={COLORS[1]}
                radius={[5, 5, 0, 0]}
                barSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">{roleTitle}</h3>
        {hasRoleData ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  outerRadius={88}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {roleData.map((_, index) => (
                    <Cell key={`role-cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px -12px rgb(0 0 0 / 0.25)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChartState title={emptyRoleMessage} />
        )}
      </div>
    </div>
  );
};

export default AdminCharts;
