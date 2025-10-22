import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom'; // <-- for back navigation

const ClockBook = () => {
  const navigate = useNavigate(); // initialize navigate
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
        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="back-btn"
        >
          ← Back
        </button>

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

      {/* ...rest of your modals and attendance table remain unchanged... */}

      <style>{`
        .clock-book { padding: 2rem; background:#f4f6f9; font-family:Arial, sans-serif; min-height:100vh; }
        .management-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; background:#fff; padding:1.5rem; border-radius:12px; box-shadow:0 3px 10px rgba(0,0,0,0.08); position: relative; }
        .back-btn { position:absolute; left:1.5rem; top:50%; transform:translateY(-50%); background:#6b7280; color:#fff; border:none; padding:0.5rem 1rem; border-radius:6px; cursor:pointer; font-weight:600; }
        .management-buttons button { margin-left:0.5rem; padding:0.6rem 1.2rem; border:none; border-radius:8px; font-weight:600; cursor:pointer; }
        .secondary{background:#10b981;color:#fff;} .warning{background:#f59e0b;color:#fff;} .info{background:#06b6d4;color:#fff;}
      `}</style>
    </div>
  );
};

export default ClockBook;
