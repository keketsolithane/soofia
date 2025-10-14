import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    initializeWeek();
    fetchTeachers();
  }, []);

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
  const getWeekDates = () => {
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
  };

  // Get day name from date
  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const fetchTeachers = async () => {
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
  };

  const fetchAttendance = async (teachersList) => {
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
      teachersList.forEach(teacher => {
        weekDates.forEach(date => {
          const key = `${teacher.id}_${date}`;
          const record = data?.find(a => a.teacher_id === teacher.id && a.date === date);
          attendanceState[key] = record?.status || 'absent';
        });
      });
      
      setAttendance(attendanceState);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

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

  const handleAttendanceChange = (teacherId, date, status) => {
    const key = `${teacherId}_${date}`;
    setAttendance(prev => ({
      ...prev,
      [key]: status
    }));
  };

  const saveAttendance = async () => {
    setLoading(true);
    try {
      const attendanceRecords = [];
      const weekDates = getWeekDates();

      Object.keys(attendance).forEach(key => {
        const [teacherId, date] = key.split('_');
        attendanceRecords.push({
          teacher_id: teacherId,
          date: date,
          status: attendance[key],
          week: currentWeek
        });
      });

      // Delete existing records for this week first
      await supabase
        .from('attendance')
        .delete()
        .eq('week', currentWeek);

      // Insert new records
      const { error } = await supabase
        .from('attendance')
        .insert(attendanceRecords);

      if (error) throw error;
      
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePastWeeks = async () => {
    if (!window.confirm('Are you sure you want to delete all past weeks attendance? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .lt('week', currentWeek);

      if (error) throw error;
      
      alert('Past weeks attendance deleted successfully!');
    } catch (error) {
      console.error('Error deleting past weeks:', error);
      alert('Error deleting past weeks: ' + error.message);
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
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
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
              ${weekDates.map(date => `
                <th>${getDayName(date)}<br>${new Date(date).toLocaleDateString()}</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${teachers.map(teacher => `
              <tr>
                <td class="teacher-name">${teacher.surname}, ${teacher.name}</td>
                <td>${teacher.subject || '-'}</td>
                ${weekDates.map(date => {
                  const key = `${teacher.id}_${date}`;
                  const status = attendance[key] || 'absent';
                  return `
                    <td class="${status}">${status.toUpperCase()}</td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="print-date">
          Printed on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
        </div>
        
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; margin: 10px;">
            Print Report
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin: 10px;">
            Close Window
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const weekDates = getWeekDates();

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
            onClick={saveAttendance}
            className="add-btn primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Attendance'}
          </button>
          <button 
            onClick={printWeeklyReport}
            className="add-btn info"
          >
            Print Weekly Report
          </button>
          <button 
            onClick={deletePastWeeks}
            className="add-btn danger"
            disabled={loading}
          >
            Delete Past Weeks
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

      {/* Attendance Table */}
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
                {weekDates.map(date => (
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
                  {weekDates.map(date => {
                    const key = `${teacher.id}_${date}`;
                    const status = attendance[key] || 'absent';
                    return (
                      <td key={date} className="attendance-cell">
                        <select
                          value={status}
                          onChange={(e) => handleAttendanceChange(teacher.id, date, e.target.value)}
                          className={`status-select status-${status}`}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
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
        .clock-book {
          padding: 2rem;
          background: #f8fafc;
          min-height: 100vh;
        }

        .management-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          background: white;
          padding: 1.5rem 2rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-content h2 {
          margin: 0 0 0.5rem 0;
          color: #1e293b;
          font-size: 1.75rem;
          font-weight: 700;
        }

        .week-display {
          margin: 0;
          color: #64748b;
          font-size: 1rem;
          font-weight: 500;
        }

        .management-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .add-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          white-space: nowrap;
        }

        .add-btn.primary {
          background: #3b82f6;
          color: white;
        }

        .add-btn.primary:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .add-btn.secondary {
          background: #10b981;
          color: white;
        }

        .add-btn.secondary:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
        }

        .add-btn.info {
          background: #06b6d4;
          color: white;
        }

        .add-btn.info:hover:not(:disabled) {
          background: #0891b2;
          transform: translateY(-1px);
        }

        .add-btn.danger {
          background: #ef4444;
          color: white;
        }

        .add-btn.danger:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .add-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .attendance-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .table-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .count-badge {
          background: #f1f5f9;
          color: #64748b;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .table-container {
          overflow-x: auto;
        }

        .attendance-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        .attendance-table th {
          padding: 1rem;
          text-align: center;
          font-weight: 600;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.875rem;
          background: #f8fafc;
        }

        .teacher-col {
          width: 200px;
          text-align: left;
        }

        .day-col {
          min-width: 120px;
        }

        .day-col .date {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        .attendance-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          text-align: center;
        }

        .teacher-name {
          text-align: left;
          font-weight: 600;
        }

        .attendance-cell {
          vertical-align: middle;
        }

        .status-select {
          padding: 0.5rem;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          max-width: 100px;
        }

        .status-select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .status-present {
          background: #d4edda;
          color: #155724;
          border-color: #c3e6cb;
        }

        .status-absent {
          background: #f8d7da;
          color: #721c24;
          border-color: #f5c6cb;
        }

        .subject-tag {
          background: #f1f5f9;
          color: #475569;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .no-subject {
          color: #94a3b8;
          font-style: italic;
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: #64748b;
        }

        .empty-state p {
          margin: 0 0 1.5rem 0;
          font-size: 1rem;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #64748b;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .close-btn:hover {
          background: #f1f5f9;
        }

        form {
          padding: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .modal-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .btn-cancel {
          padding: 0.75rem 1.5rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .btn-submit {
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .btn-submit:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .clock-book {
            padding: 1rem;
          }

          .management-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .management-buttons {
            flex-direction: column;
          }

          .table-header {
            padding: 1rem;
          }

          .attendance-table th,
          .attendance-table td {
            padding: 0.75rem 0.5rem;
          }

          .modal {
            margin: 1rem;
          }

          form {
            padding: 1.5rem;
          }

          .modal-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ClockBook;