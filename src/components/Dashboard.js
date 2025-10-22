import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const ClockBook = () => {
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [currentWeek, setCurrentWeek] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeEntries, setTimeEntries] = useState({});

  // Initialize current week
  const initializeWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday
    
    const weekString = `${startOfWeek.toISOString().split('T')[0]}_to_${endOfWeek.toISOString().split('T')[0]}`;
    setCurrentWeek(weekString);
  };

  // Get current week dates (Monday to Friday)
  const getWeekDates = useCallback(() => {
    if (!currentWeek) return [];
    
    const [startStr] = currentWeek.split('_to_');
    const startDate = new Date(startStr);
    const dates = [];
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, [currentWeek]);

  // Get day name from date
  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const fetchAttendance = useCallback(async (teachersList) => {
    try {
      const weekDates = getWeekDates();
      if (weekDates.length === 0) return;

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .in('date', weekDates)
        .in('teacher_id', teachersList.map(t => t.id));

      if (error) throw error;

      // Initialize attendance state
      const attendanceState = {};
      const timeEntriesState = {};
      
      teachersList.forEach(teacher => {
        weekDates.forEach(date => {
          const key = `${teacher.id}_${date}`;
          const record = data?.find(a => a.teacher_id === teacher.id && a.date === date);
          attendanceState[key] = record?.status || 'absent';
          timeEntriesState[key] = {
            clockIn: record?.clock_in || '',
            clockOut: record?.clock_out || '',
            hours: record?.hours || ''
          };
        });
      });
      
      setAttendance(attendanceState);
      setTimeEntries(timeEntriesState);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  }, [getWeekDates]);

  const fetchTeachers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('surname');

      if (error) throw error;
      setTeachers(data || []);
      fetchAttendance(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  }, [fetchAttendance]);

  useEffect(() => {
    fetchTeachers();
    initializeWeek();
  }, [fetchTeachers]);

  const handleAttendanceChange = (teacherId, date, status) => {
    const key = `${teacherId}_${date}`;
    setAttendance(prev => ({
      ...prev,
      [key]: status
    }));
  };

  const handleTimeChange = (teacherId, date, field, value) => {
    const key = `${teacherId}_${date}`;
    setTimeEntries(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const saveAttendance = async () => {
    setLoading(true);
    try {
      const weekDates = getWeekDates();

      for (const key of Object.keys(attendance)) {
        const [teacherId, date] = key.split('_');
        if (!weekDates.includes(date)) continue;

        const timeEntry = timeEntries[key] || {};

        const record = {
          teacher_id: teacherId,
          date,
          status: attendance[key],
          clock_in: timeEntry.clockIn || null,
          clock_out: timeEntry.clockOut || null,
          hours: timeEntry.hours !== "" ? parseFloat(timeEntry.hours) : null,
          week: currentWeek
        };

        const { data: existing, error: selectError } = await supabase
          .from('attendance')
          .select('id')
          .eq('teacher_id', teacherId)
          .eq('date', date)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          throw selectError;
        }

        if (existing) {
          await supabase.from('attendance').update(record).eq('id', existing.id);
        } else {
          await supabase.from('attendance').insert([record]);
        }
      }

      alert('Attendance and time records saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving records: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clock-book">
      <div className="management-header">
        <div className="header-content">
          <h2>Teacher Clock Book</h2>
          <p className="week-display">
            Week: {currentWeek ? currentWeek.replace('_to_', ' to ') : 'Loading...'}
          </p>
        </div>
        <div className="management-buttons">
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="add-btn secondary"
          >
            ← Back
          </button>
          <button 
            onClick={saveAttendance}
            className="add-btn primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save All Records'}
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="attendance-section">
        <div className="table-header">
          <h3>Weekly Attendance & Time Tracking</h3>
          <span className="count-badge">{teachers.length} teachers</span>
        </div>
        
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th className="teacher-col">Teacher</th>
                <th>Subject</th>
                {getWeekDates().map(date => (
                  <th key={date} className="day-col">
                    <div>{getDayName(date)}</div>
                    <div className="date">{new Date(date).toLocaleDateString()}</div>
                    <div className="time-headers">
                      <span>Status</span>
                      <span>Clock In</span>
                      <span>Clock Out</span>
                      <span>Hours</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => (
                <tr key={teacher.id}>
                  <td className="teacher-name">
                    <strong>{teacher.surname}, {teacher.name}</strong>
                  </td>
                  <td>
                    {teacher.subject ? (
                      <span className="subject-tag">{teacher.subject}</span>
                    ) : (
                      <span className="no-subject">-</span>
                    )}
                  </td>
                  {getWeekDates().map(date => {
                    const key = `${teacher.id}_${date}`;
                    const status = attendance[key] || 'absent';
                    const timeEntry = timeEntries[key] || { clockIn: '', clockOut: '', hours: '' };
                    
                    return (
                      <td key={date} className="attendance-cell">
                        <div className="time-fields">
                          <select
                            value={status}
                            onChange={(e) => handleAttendanceChange(teacher.id, date, e.target.value)}
                            className={`status-select status-${status}`}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                          </select>
                          
                          <input
                            type="time"
                            value={timeEntry.clockIn}
                            onChange={(e) => handleTimeChange(teacher.id, date, 'clockIn', e.target.value)}
                            className="time-input"
                            placeholder="--:--"
                          />
                          
                          <input
                            type="time"
                            value={timeEntry.clockOut}
                            onChange={(e) => handleTimeChange(teacher.id, date, 'clockOut', e.target.value)}
                            className="time-input"
                            placeholder="--:--"
                          />
                          
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            value={timeEntry.hours}
                            onChange={(e) => handleTimeChange(teacher.id, date, 'hours', e.target.value)}
                            className="hours-input"
                            placeholder="0.0"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          
          {teachers.length === 0 && (
            <div className="empty-state">
              <p>No teachers found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Styles (unchanged) */}
      <style jsx>{`
        .clock-book { padding: 2rem; background: #f8fafc; min-height: 100vh; }
        .management-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; background: white; padding: 1.5rem 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
        .header-content h2 { margin: 0 0 0.5rem 0; color: #1e293b; font-size: 1.75rem; font-weight: 700; }
        .week-display { margin: 0; color: #64748b; font-size: 1rem; font-weight: 500; }
        .management-buttons { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .add-btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-size: 0.875rem; white-space: nowrap; }
        .add-btn.primary { background: #3b82f6; color: white; }
        .add-btn.primary:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); }
        .add-btn.secondary { background: #6b7280; color: white; }
        .add-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .attendance-section { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .table-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; border-bottom: 1px solid #e2e8f0; }
        .table-header h3 { margin: 0; color: #1e293b; font-size: 1.25rem; font-weight: 600; }
        .count-badge { background: #f1f5f9; color: #64748b; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: 500; }
        .table-container { overflow-x: auto; }
        .attendance-table { width: 100%; border-collapse: collapse; min-width: 1000px; }
        .attendance-table th { padding: 1rem; text-align: center; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; background: #f8fafc; }
        .teacher-col { width: 200px; text-align: left; }
        .day-col { min-width: 200px; }
        .day-col .date { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
        .time-headers { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.7rem; font-weight: 500; }
        .attendance-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; text-align: center; }
        .teacher-name { text-align: left; font-weight: 600; }
        .attendance-cell { vertical-align: middle; }
        .time-fields { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.5rem; align-items: center; }
        .status-select { padding: 0.5rem; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease; width: 100%; }
        .status-select:focus { outline: none; border-color: #3b82f6; }
        .status-present { background: #d4edda; color: #155724; border-color: #c3e6cb; }
        .status-absent { background: #f8d7da; color: #721c24; border-color: #f5c6cb; }
        .time-input, .hours-input { padding: 0.5rem; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 0.75rem; width: 100%; text-align: center; }
        .time-input:focus, .hours-input:focus { outline: none; border-color: #3b82f6; }
        .hours-input { -moz-appearance: textfield; }
        .hours-input::-webkit-outer-spin-button, .hours-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .subject-tag { background: #f1f5f9; color: #475569; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; }
        .no-subject { color: #94a3b8; font-style: italic; }
        .empty-state { padding: 3rem; text-align: center; color: #64748b; }
        .empty-state p { margin: 0; font-size: 1rem; }
        @media (max-width: 768px) {
          .clock-book { padding: 1rem; }
          .management-header { flex-direction: column; gap: 1rem; align-items: stretch; }
          .management-buttons { flex-direction: column; }
          .table-header { padding: 1rem; }
          .attendance-table th, .attendance-table td { padding: 0.75rem 0.5rem; }
          .time-fields { gap: 0.25rem; }
          .status-select, .time-input, .hours-input { font-size: 0.7rem; padding: 0.25rem; }
        }
      `}</style>
    </div>
  );
};

export default ClockBook;
