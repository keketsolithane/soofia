import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    username: '',
    role: 'teacher'
  });

  const [newTeacher, setNewTeacher] = useState({
    name: '',
    surname: '',
    subject: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchTeachers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('surname');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) throw authError;

      // Then create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          username: newUser.username,
          full_name: newUser.full_name,
          role: newUser.role
        }]);

      if (profileError) throw profileError;

      setNewUser({ email: '', password: '', full_name: '', username: '', role: 'teacher' });
      setShowAddUser(false);
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>User Management</h2>
        <div className="management-buttons">
          <button 
            onClick={() => setShowAddUser(true)}
            className="add-btn"
          >
            Add New User
          </button>
          <button 
            onClick={() => setShowAddTeacher(true)}
            className="add-btn"
          >
            Add New Teacher
          </button>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New User</h3>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="teacher">Teacher</option>
                  <option value="security">Security</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowAddUser(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddTeacher && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Teacher</h3>
            <form onSubmit={handleAddTeacher}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Surname</label>
                <input
                  type="text"
                  value={newTeacher.surname}
                  onChange={(e) => setNewTeacher({...newTeacher, surname: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={newTeacher.subject}
                  onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})}
                />
              </div>
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowAddTeacher(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="management-tables">
        <div className="users-table">
          <h3>System Users</h3>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.full_name}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="teachers-table">
          <h3>Teachers</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Surname</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => (
                <tr key={teacher.id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.surname}</td>
                  <td>{teacher.subject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;