import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

const AttendanceTable = ({ teachers, userRole, currentUser }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  const weekDays = Array.from({ length: 5 }, (_, i) => 
    addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), i)
  );

  useEffect(() => {
    fetchAttendance();
  }, [currentWeek]);

  const fetchAttendance = async () => {
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 4);

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      const attendanceMap = {};
      data?.forEach(record => {
        const key = `${record.teacher_id}-${record.date}-${record.time_slot}`;
        attendanceMap[key] = record.status;
      });

      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleStatusChange = async (teacherId, date, timeSlot, status) => {
    if (userRole === 'teacher') return;

    try {
      setLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      const key = `${teacherId}-${dateStr}-${timeSlot}`;

      const { error } = await supabase
        .from('attendance')
        .upsert({
          teacher_id: teacherId,
          date: dateStr,
          time_slot: timeSlot,
          status: status,
          recorded_by: currentUser.id
        }, {
          onConflict: 'teacher_id,date,time_slot'
        });

      if (error) throw error;

      setAttendance(prev => ({
        ...prev,
        [key]: status
      }));
    } catch (error) {
      console.error('Error updating attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWeekChange = (direction) => {
    setCurrentWeek(prev => addDays(prev, direction * 7));
  };

  const getStatus = (teacherId, date, timeSlot) => {
    const key = `${teacherId}-${format(date, 'yyyy-MM-dd')}-${timeSlot}`;
    return attendance[key] || '';
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h2>Teacher Attendance</h2>
        <div className="attendance-controls">
          <button onClick={() => handleWeekChange(-1)} className="week-nav-btn">
            Previous Week
          </button>
          <span className="week-display">
            Week of {format(weekDays[0], 'MMM dd')} - {format(weekDays[4], 'MMM dd, yyyy')}
          </span>
          <button onClick={() => handleWeekChange(1)} className="week-nav-btn">
            Next Week
          </button>
          <button onClick={handlePrint} className="print-btn">
            Print Weekly Report
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Teacher Name</th>
              {weekDays.map(day => (
                <th key={day.toString()} colSpan={timeSlots.length}>
                  {format(day, 'EEEE, MMM dd')}
                </th>
              ))}
            </tr>
            <tr>
              <th></th>
              {weekDays.map(day => 
                timeSlots.map(slot => (
                  <th key={`${day}-${slot}`} className="time-slot-header">
                    {slot}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {teachers.map(teacher => (
              <tr key={teacher.id}>
                <td className="teacher-name">
                  {teacher.name} {teacher.surname}
                  {teacher.subject && <small>{teacher.subject}</small>}
                </td>
                {weekDays.map(day => 
                  timeSlots.map(slot => {
                    const status = getStatus(teacher.id, day, slot);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <td 
                        key={`${teacher.id}-${day}-${slot}`}
                        className={`attendance-cell ${isToday ? 'today' : ''}`}
                      >
                        {userRole !== 'teacher' ? (
                          <select
                            value={status}
                            onChange={(e) => 
                              handleStatusChange(teacher.id, day, slot, e.target.value)
                            }
                            disabled={loading}
                            className={`status-select ${status}`}
                          >
                            <option value="">-</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                          </select>
                        ) : (
                          <span className={`status-display ${status}`}>
                            {status || '-'}
                          </span>
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;