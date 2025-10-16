import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const ClockBook = () => {
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [currentWeek, setCurrentWeek] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);

  const [newTeacher, setNewTeacher] = useState({
    name: '',
    surname: '',
    subject: ''
  });

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

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Fetch attendance including clock_in and clock_out
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

      const attendanceState = {};
      teachersList.forEach(teacher => {
        weekDates.forEach(date => {
          const key = `${teacher.id}_${date}`;
          const record = data?.find(a => a.teacher_id === teacher.id && a.date === date);
          attendanceState[key] = {
            status: record?.status || 'absent',
            clock_in: record?.clock_in || '--:--',
            clock_out: record?.clock_out || '--:--'
          };
        });
      });

      setAttendance(attendanceState);
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

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('teachers')
        .insert([newTeacher]);
      if (error) throw error;

      setNewTeacher({ name: '', surname: '', subject: '' });
      setShowAddTeacher(false);
      fetchTeachers();
    } catch (error) {
      console.error('Error adding teacher:', error);
    } finally {
      setLoading(false);
    }
  };

  const printWeeklyReport = () => {
    const printWindow = window.open('', '_blank');
    const weekDates = getWeekDates();
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Weekly Attendance Report - ${currentWeek}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .school-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .report-title { font-size: 18px; margin-bottom: 10px; }
          .week-range { font-size: 16px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .present { background-color: #d4edda; color: #155724; }
          .absent { background-color: #f8d7da; color: #721c24; }
          .teacher-name { font-weight: bold; }
          .print-date { text-align: right; margin-top: 30px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">Soofia High School</div>
          <div class="report-title">Weekly Teacher Attendance Report</div>
          <div class="week-range">Week: ${currentWeek.replace('_to_', ' to ')}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Subject</th>
              ${weekDates.map(date => `<th>${getDayName(date)}<br>${new Date(date).toLocaleDateString()}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${teachers.map(teacher => `
              <tr>
                <td class="teacher-name">${teacher.surname}, ${teacher.name}</td>
                <td>${teacher.subject || '-'}</td>
                ${weekDates.map(date => {
                  const key = `${teacher.id}_${date}`;
                  const record = attendance[key] || { status: 'absent', clock_in: '--:--', clock_out: '--:--' };
                  return `<td class="${record.status}">
                    ${record.status.toUpperCase()}<br>
                    In: ${record.clock_in} Out: ${record.clock_out}
                  </td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="print-date">
          Printed on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
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
          <button 
            onClick={() => setShowAddTeacher(true)}
            className="add-btn secondary"
          >
            Add New Teacher
          </button>
          <button 
            onClick={printWeeklyReport}
            className="add-btn info"
          >
            Print Weekly Report
          </button>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {showAddTeacher && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Teacher</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddTeacher(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddTeacher}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Surname</label>
                <input
                  type="text"
                  value={newTeacher.surname}
                  onChange={(e) => setNewTeacher({...newTeacher, surname: e.target.value})}
                  required
                  placeholder="Enter last name"
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={newTeacher.subject}
                  onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})}
                  placeholder="Enter subject"
                />
              </div>
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowAddTeacher(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Table (READ-ONLY with clock_in/clock_out) */}
      <div className="attendance-section">
        <div className="table-header">
          <h3>Weekly Attendance</h3>
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
                    const record = attendance[key] || { status: 'absent', clock_in: '--:--', clock_out: '--:--' };
                    return (
                      <td key={date} className={`attendance-cell ${record.status}`}>
                        {record.status.toUpperCase()}<br />
                        In: {record.clock_in} Out: {record.clock_out}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          
          {teachers.length === 0 && (
            <div className="empty-state">
              <p>No teachers found. Add teachers to start tracking attendance.</p>
              <button 
                onClick={() => setShowAddTeacher(true)}
                className="add-btn primary"
              >
                Add First Teacher
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Your existing CSS can go here */
      `}</style>
    </div>
  );
};

export default ClockBook;
