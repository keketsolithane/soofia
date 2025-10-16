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
  const [showTeachersTable, setShowTeachersTable] = useState(false);

  const [teacherForm, setTeacherForm] = useState({ name: '', surname: '', subject: '' });

  // Initialize current week (Mon-Fri)
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
      if (!weekDates.length) return;

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
        const { error } = await supabase
          .from('teachers')
          .update(teacherForm)
          .eq('id', editingTeacher.id);
        if (error) throw error;
      } else {
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
      const { error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .eq('teacher_id', teacherId);
      if (attendanceError) throw attendanceError;

      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId);
      if (error) throw error;

      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Error deleting teacher. Please try again.');
    }
  };

  const printClockBookPDF = () => {
    const doc = new jsPDF();
    doc.text(`Teacher Clock Book - Week: ${currentWeek.replace('_to_', ' to ')}`, 14, 15);

    const weekDates = getWeekDates();
    const tableBody = teachers.map(teacher =>
      [
        `${teacher.surname}, ${teacher.name}`,
        teacher.subject || '-',
        ...weekDates.map(date => {
          const key = `${teacher.id}_${date}`;
          const record = attendance[key] || { status: 'absent', clock_in: '--:--', clock_out: '--:--' };
          return {
            content: `${record.status.toUpperCase()}\nIn: ${record.clock_in} Out: ${record.clock_out}`,
            styles: { fillColor: record.status === 'present' ? [212, 237, 218] : [248, 215, 218], textColor: record.status === 'present' ? [21, 87, 36] : [114, 28, 36] }
          };
        })
      ]
    );

    doc.autoTable({
      head: [['Teacher', 'Subject', ...weekDates.map(d => getDayName(d))]],
      body: tableBody,
      startY: 25,
      styles: { fontSize: 8, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
      theme: 'grid'
    });

    doc.save(`ClockBook_${currentWeek}.pdf`);
  };

  return (
    <div className="clock-book">
      <div className="management-header">
        <div className="header-content">
          <h2>Teacher Clock Book</h2>
          <p className="week-display">Week: {currentWeek ? currentWeek.replace('_to_', ' to ') : 'Loading...'}</p>
        </div>
        <div className="management-buttons">
          <button onClick={() => { setShowAddTeacher(true); setEditingTeacher(null); setTeacherForm({ name: '', surname: '', subject: '' }); }} className="add-btn secondary">Add New Teacher</button>
          <button onClick={() => setShowTeachersTable(true)} className="add-btn warning">Manage Teachers</button>
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
                <input type="text" value={teacherForm.name} onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Surname</label>
                <input type="text" value={teacherForm.surname} onChange={e => setTeacherForm({ ...teacherForm, surname: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input type="text" value={teacherForm.subject} onChange={e => setTeacherForm({ ...teacherForm, subject: e.target.value })} />
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn-cancel" onClick={() => setShowAddTeacher(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teachers Management Modal */}
      {showTeachersTable && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>Manage Teachers</h3>
              <button className="close-btn" onClick={() => setShowTeachersTable(false)}>✕</button>
            </div>
            <div className="table-container">
              <table className="teachers-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Surname</th>
                    <th>Subject</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(teacher => (
                    <tr key={teacher.id}>
                      <td>{teacher.name}</td>
                      <td>{teacher.surname}</td>
                      <td>{teacher.subject || '-'}</td>
                      <td>
                        <button onClick={() => handleEditTeacher(teacher)} className="action-btn edit">Edit</button>
                        <button onClick={() => handleDeleteTeacher(teacher.id)} className="action-btn delete">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {teachers.length === 0 && <div className="empty-state">No teachers found.</div>}
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowTeachersTable(false)}>Close</button>
            </div>
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
                <th>Teacher</th>
                <th>Subject</th>
                {getWeekDates().map(date => <th key={date}>{getDayName(date)}<br />{new Date(date).toLocaleDateString()}</th>)}
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
                    return <td key={date}>{record.status.toUpperCase()}<br />In: {record.clock_in} Out: {record.clock_out}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .clock-book { padding: 2rem; background: #f4f6f9; min-height: 100vh; font-family: Arial, sans-serif; }
        .management-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; background: #fff; padding: 1.5rem 2rem; border-radius: 12px; box-shadow: 0 3px 10px rgba(0,0,0,0.08); }
        .management-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .add-btn { padding: 0.6rem 1.2rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
        .add-btn.secondary { background: #10b981; color: #fff; }
        .add-btn.warning { background: #f59e0b; color: #fff; }
        .add-btn.info { background: #06b6d4; color: #fff; }
        .add-btn:hover { opacity: 0.85; transform: translateY(-1px); }

        .attendance-section { background: #fff; border-radius: 12px; box-shadow: 0 3px 10px rgba(0,0,0,0.08); overflow-x: auto; margin-top: 1rem; padding: 1rem; }
        .attendance-table { width: 100%; border-collapse: collapse; }
        .attendance-table th, .attendance-table td { border: 1px solid #ddd; padding: 0.75rem; text-align: center; font-size: 0.9rem; }
        .attendance-table th { background: #f0f0f0; color: #333; font-weight: 600; }
        .attendance-table tr:nth-child(even) { background: #fafafa; }
        .attendance-table tr:hover { background: #e6f2ff; transition: 0.3s; }

        .modal-overlay { position: fixed; top: 0; left: 0; right:0; bottom:0; background: rgba(0,0,0,0.4); display:flex; justify-content:center; align-items:center; z-index:1000; }
        .modal { background:#fff; border-radius:12px; max-width:600px; width:90%; max-height:90vh; overflow:auto; }
        .modal.large-modal { max-width:800px; }
        .modal-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.5rem; border-bottom:1px solid #e0e0e0; }
        .modal-header h3 { margin:0; color:#2b5fc0; }
        .close-btn { background:none; border:none; font-size:1.2rem; cursor:pointer; }
        .form-group { padding:1rem 1.5rem; }
        .form-group label { display:block; margin-bottom:0.5rem; font-weight:600; }
        .form-group input { width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:6px; }
        .modal-buttons { display:flex; justify-content:flex-end; gap:0.75rem; padding:1rem 1.5rem; border-top:1px solid #e0e0e0; }
        .btn-cancel { padding:0.5rem 1rem; background:#6b7280; color:#fff; border:none; border-radius:6px; cursor:pointer; }
        .btn-submit { padding:0.5rem 1rem; background:#10b981; color:#fff; border:none; border-radius:6px; cursor:pointer; }
        .teachers-table { width:100%; border-collapse:collapse; }
        .teachers-table th, .teachers-table td { border:1px solid #ddd; padding:0.75rem; text-align:left; font-size:0.9rem; }
        .teachers-table th { background:#f0f0f0; font-weight:600; }
        .action-btn { margin:0 0.25rem; padding:0.25rem 0.5rem; font-size:0.8rem; border:none; border-radius:4px; cursor:pointer; }
        .action-btn.edit { background:#3b82f6; color:#fff; }
        .action-btn.delete { background:#ef4444; color:#fff; }
        .action-btn:hover { opacity:0.85; }
        .empty-state { padding:2rem; text-align:center; color:#6b7280; }
      `}</style>
    </div>
  );
};

export default ClockBook;
