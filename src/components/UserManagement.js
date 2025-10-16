import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { jsPDF } from 'jspdf';
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
    if (!teachers.length) return alert("No teachers to print!");

    const doc = new jsPDF();
    doc.text(`Teacher Clock Book - Week: ${currentWeek.replace('_to_', ' to ')}`, 14, 15);

    const weekDates = getWeekDates();
    const tableBody = teachers.map(teacher => [
      `${teacher.surname}, ${teacher.name}`,
      teacher.subject || '-',
      ...weekDates.map(date => {
        const key = `${teacher.id}_${date}`;
        const record = attendance[key] || { status: 'absent', clock_in: '--:--', clock_out: '--:--' };
        return `${record.status.toUpperCase()}\nIn: ${record.clock_in} Out: ${record.clock_out}`;
      })
    ]);

    doc.autoTable({
      head: [['Teacher', 'Subject', ...weekDates.map(d => getDayName(d))]],
      body: tableBody,
      startY: 25,
      styles: { fontSize: 8, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [245, 245, 245], textColor: [0,0,0], fontStyle: 'bold' },
      theme: 'grid'
    });

    doc.save(`ClockBook_${currentWeek}.pdf`);
  };

  return (
    <div className="clock-book">
      <div className="management-header">
        <div>
          <h2>Teacher Clock Book</h2>
          <p>Week: {currentWeek ? currentWeek.replace('_to_', ' to ') : 'Loading...'}</p>
        </div>
        <div className="management-buttons">
          <button onClick={() => { setShowAddTeacher(true); setEditingTeacher(null); setTeacherForm({ name: '', surname: '', subject: '' }) }} className="add-btn secondary">Add Teacher</button>
          <button onClick={() => setShowTeachersTable(true)} className="add-btn warning">Manage Teachers</button>
          <button onClick={printClockBookPDF} className="add-btn info">Print PDF</button>
        </div>
      </div>

      {showAddTeacher && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h3>
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
                <button type="submit" className="btn-submit">{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <tr><th>Name</th><th>Surname</th><th>Subject</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>{t.surname}</td>
                      <td>{t.subject || '-'}</td>
                      <td>
                        <button className="action-btn edit" onClick={() => handleEditTeacher(t)}>Edit</button>
                        <button className="action-btn delete" onClick={() => handleDeleteTeacher(t.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>No teachers found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="attendance-section">
        <h3>Weekly Attendance ({teachers.length} teachers)</h3>
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                {getWeekDates().map(d => <th key={d}>{getDayName(d)}<br />{new Date(d).toLocaleDateString()}</th>)}
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id}>
                  <td>{t.surname}, {t.name}</td>
                  <td>{t.subject || '-'}</td>
                  {getWeekDates().map(d => {
                    const key = `${t.id}_${d}`;
                    const record = attendance[key] || { status:'absent', clock_in:'--:--', clock_out:'--:--' };
                    return <td key={d}>{record.status.toUpperCase()}<br />In:{record.clock_in} Out:{record.clock_out}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .clock-book { padding: 2rem; background:#f4f6f9; font-family:Arial, sans-serif; min-height:100vh; }
        .management-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; background:#fff; padding:1.5rem; border-radius:12px; box-shadow:0 3px 10px rgba(0,0,0,0.08); }
        .management-buttons button { margin-left:0.5rem; padding:0.6rem 1.2rem; border:none; border-radius:8px; font-weight:600; cursor:pointer; }
        .secondary{background:#10b981;color:#fff;} .warning{background:#f59e0b;color:#fff;} .info{background:#06b6d4;color:#fff;}
        .attendance-section { background:#fff; border-radius:12px; padding:1rem; box-shadow:0 3px 10px rgba(0,0,0,0.08); overflow-x:auto; }
        table { width:100%; border-collapse:collapse; font-size:0.9rem; }
        th, td { border:1px solid #ddd; padding:0.75rem; text-align:center; }
        th { background:#f0f0f0; font-weight:600; }
        tr:nth-child(even){background:#fafafa;} tr:hover{background:#e6f2ff;transition:0.3s;}
        .modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.4); display:flex; justify-content:center; align-items:center; z-index:1000; }
        .modal { background:#fff; border-radius:12px; max-width:600px; width:90%; max-height:90vh; overflow:auto; }
        .large-modal{max-width:800px;}
        .modal-header{display:flex;justify-content:space-between;align-items:center;padding:1rem;border-bottom:1px solid #e0e0e0;}
        .close-btn{background:none;border:none;font-size:1.2rem;cursor:pointer;}
        .form-group{padding:1rem;} .form-group label{display:block;margin-bottom:0.5rem;font-weight:600;}
        .form-group input{width:100%;padding:0.5rem;border:1px solid #ccc;border-radius:6px;}
        .modal-buttons{display:flex;justify-content:flex-end;gap:0.5rem;padding:1rem;border-top:1px solid #e0e0e0;}
        .btn-cancel{background:#6b7280;color:#fff;padding:0.5rem 1rem;border:none;border-radius:6px;cursor:pointer;}
        .btn-submit{background:#10b981;color:#fff;padding:0.5rem 1rem;border:none;border-radius:6px;cursor:pointer;}
        .action-btn{margin:0 0.25rem;padding:0.25rem 0.5rem;font-size:0.8rem;border:none;border-radius:4px;cursor:pointer;}
        .edit{background:#3b82f6;color:#fff;} .delete{background:#ef4444;color:#fff;}
      `}</style>
    </div>
  );
};

export default ClockBook;
