import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ClockBook = () => {
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [currentWeek, setCurrentWeek] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const [teacherForm, setTeacherForm] = useState({ name: '', surname: '', subject: '' });

  const initializeWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4);
    setCurrentWeek(`${startOfWeek.toISOString().split('T')[0]}_to_${endOfWeek.toISOString().split('T')[0]}`);
  };

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
    initializeWeek();
    fetchTeachers();
  }, [fetchTeachers]);

  const handleSubmitTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingTeacher) {
        // Update teacher
        const { error } = await supabase
          .from('teachers')
          .update(teacherForm)
          .eq('id', editingTeacher.id);
        if (error) throw error;
      } else {
        // Add new teacher
        const { error } = await supabase
          .from('teachers')
          .insert([teacherForm]);
        if (error) throw error;
      }

      setTeacherForm({ name: '', surname: '', subject: '' });
      setShowAddTeacher(false);
      setEditingTeacher(null);
      fetchTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setTeacherForm({ name: teacher.name, surname: teacher.surname, subject: teacher.subject });
    setShowAddTeacher(true);
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId);
      if (error) throw error;
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const printClockBookPDF = () => {
    const doc = new jsPDF();
    doc.text(`Teacher Clock Book - Week: ${currentWeek.replace('_to_', ' to ')}`, 14, 15);
    const weekDates = getWeekDates();
    const tableData = teachers.map(teacher => [
      `${teacher.surname}, ${teacher.name}`,
      teacher.subject || '-',
      ...weekDates.map(date => {
        const key = `${teacher.id}_${date}`;
        const record = attendance[key] || { status: 'absent', clock_in: '--:--', clock_out: '--:--' };
        return `${record.status.toUpperCase()} (In: ${record.clock_in} Out: ${record.clock_out})`;
      })
    ]);
    doc.autoTable({
      head: [['Teacher', 'Subject', ...weekDates.map(d => getDayName(d))]],
      body: tableData,
      startY: 25,
    });
    doc.save(`ClockBook_${currentWeek}.pdf`);
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
          <button onClick={() => { setShowAddTeacher(true); setEditingTeacher(null); setTeacherForm({ name: '', surname: '', subject: '' }); }} className="add-btn secondary">Add New Teacher</button>
          <button onClick={printClockBookPDF} className="add-btn info">Print as PDF</button>
        </div>
      </div>

      {/* Add/Edit Teacher Modal */}
      {showAddTeacher && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <button className="close-btn" onClick={() => setShowAddTeacher(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitTeacher}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Surname</label>
                <input type="text" value={teacherForm.surname} onChange={e => setTeacherForm({...teacherForm, surname: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input type="text" value={teacherForm.subject} onChange={e => setTeacherForm({...teacherForm, subject: e.target.value})} />
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn-cancel" onClick={() => setShowAddTeacher(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="attendance-section">
        <div className="table-header">
          <h3>Weekly Attendance</h3>
          <span className="count-badge">{teachers.length} teachers</span>
        </div>
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                {getWeekDates().map(date => (
                  <th key={date}>{getDayName(date)}<br/>{new Date(date).toLocaleDateString()}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => (
                <tr key={teacher.id}>
                  <td>{teacher.surname}, {teacher.name}</td>
                  <td>{teacher.subject || '-'}</td>
                  {getWeekDates().map(date => {
                    const key = `${teacher.id}_${date}`;
                    const record = attendance[key] || { status: 'absent', clock_in: '--:--', clock_out: '--:--' };
                    return <td key={date}>{record.status.toUpperCase()}<br/>In: {record.clock_in} Out: {record.clock_out}</td>;
                  })}
                  <td>
                    <button onClick={() => handleEditTeacher(teacher)} className="action-btn edit">Edit</button>
                    <button onClick={() => handleDeleteTeacher(teacher.id)} className="action-btn delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .clock-book { padding: 2rem; background: #f8fafc; min-height: 100vh; }
        .management-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; background: white; padding: 1.5rem 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .add-btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .add-btn.secondary { background: #10b981; color: white; } 
        .add-btn.info { background: #06b6d4; color: white; }
        .attendance-section { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; margin-top: 1rem; }
        .attendance-table { width: 100%; border-collapse: collapse; }
        .attendance-table th, .attendance-table td { border: 1px solid #ddd; padding: 0.5rem; text-align: center; }
        .action-btn { margin: 0 0.25rem; padding: 0.25rem 0.5rem; font-size: 0.75rem; border: none; border-radius: 4px; cursor: pointer; }
        .action-btn.edit { background: #3b82f6; color: white; }
        .action-btn.delete { background: #ef4444; color: white; }
      `}</style>
    </div>
  );
};

export default ClockBook;
