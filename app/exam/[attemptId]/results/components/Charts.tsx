"use client";

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  PieChart, Pie
} from 'recharts';

interface ChartsProps {
  sections: any[];
}

export function Charts({ sections }: ChartsProps) {
  // 1. Radar Chart Data (% score across sections)
  const radarData = sections.map(s => {
    // Shorten name to first word to prevent overlapping labels on Radar chart
    const shortName = s.name.split(' ')[0];
    return {
      subject: shortName,
      A: s.maxScore > 0 ? Math.round(((s.scoreObtained ?? 0) / s.maxScore) * 100) : 0,
      fullMark: 100,
    };
  });

  // 2. Bar Chart Data (Score vs Max)
  const barData = sections.map(s => ({
    name: s.name.length > 12 ? s.name.substring(0, 12) + '...' : s.name,
    score: s.scoreObtained ?? 0,
    maxScore: s.maxScore,
    percentage: s.maxScore > 0 ? Math.round(((s.scoreObtained ?? 0) / s.maxScore) * 100) : 0,
  }));

  // Neo-Brutalism Colors
  const COLORS = ['#FF4081', '#00E676', '#FFB800', '#2979FF', '#AA00FF'];

  // 3. Donut Chart Data (Time allocation)
  const timeData = sections.map(s => ({
    name: s.name,
    value: s.timeSpentSeconds || 1, // fallback so chart renders something if 0
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
      {/* Radar Chart */}
      <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col items-center">
        <h3 className="font-bold text-lg mb-4 self-start border-b-2 border-black w-full pb-2">Skill Profile</h3>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
              <PolarGrid stroke="#000" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#000', fontSize: 11, fontWeight: 'bold' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score %" dataKey="A" stroke="#000" strokeWidth={3} fill="#00E676" fillOpacity={0.7} />
              <Tooltip
                contentStyle={{ border: '2px solid black', borderRadius: 0, boxShadow: '4px 4px 0px rgba(0,0,0,1)' }}
                itemStyle={{ color: 'black', fontWeight: 'bold' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col items-center">
        <h3 className="font-bold text-lg mb-4 self-start border-b-2 border-black w-full pb-2">Scores by Section</h3>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="name" tick={{ fill: '#000', fontSize: 11, fontWeight: 'bold' }} interval={0} angle={-15} textAnchor="end" />
              <YAxis tick={{ fill: '#000', fontWeight: 'bold' }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ border: '2px solid black', borderRadius: 0, boxShadow: '4px 4px 0px rgba(0,0,0,1)' }}
              />
              <Bar dataKey="score" stroke="#000" strokeWidth={2}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col items-center">
        <h3 className="font-bold text-lg mb-4 self-start border-b-2 border-black w-full pb-2">Time Allocation</h3>
        <div className="w-full h-[250px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={timeData}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="#000"
                strokeWidth={2}
              >
                {timeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => {
                  if (value === 1) return ['< 1s', 'Time'];
                  const m = Math.floor(value / 60);
                  const s = value % 60;
                  return [`${m}m ${s}s`, 'Time'];
                }}
                contentStyle={{ border: '2px solid black', borderRadius: 0, boxShadow: '4px 4px 0px rgba(0,0,0,1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-bold text-xl">Time</span>
          </div>
        </div>
      </div>
    </div>
  );
}
