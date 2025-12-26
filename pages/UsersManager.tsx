import React, { useEffect, useState } from 'react';
import { getUsers, saveUser, deleteUser, addLog } from '../services/storageService';
import { User, UserRole } from '../types';
import { Trash2, UserPlus, Shield, ShieldAlert, User as UserIcon } from 'lucide-react';

interface Props {
  currentUser: User;
}

const UsersManager: React.FC<Props> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<User>({
    username: '',
    password: '',
    fullName: '',
    role: UserRole.USER
  });

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;

    saveUser(newUser);
    setUsers(getUsers());
    addLog(currentUser.username, 'ADD_USER', `נוסף משתמש חדש: ${newUser.username}`);
    setNewUser({ username: '', password: '', fullName: '', role: UserRole.USER });
  };

  const handleDelete = (username: string) => {
    if (username === 'Niv') {
      alert('לא ניתן למחוק את משתמש האדמין הראשי');
      return;
    }
    if (confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      deleteUser(username);
      setUsers(getUsers());
      addLog(currentUser.username, 'DELETE_USER', `נמחק משתמש: ${username}`);
    }
  };

  return (
    <div>
       <h2 className="text-3xl font-bold text-white mb-8">ניהול משתמשים</h2>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* List */}
         <div className="lg:col-span-2 bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden">
           <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <span className="text-slate-400 font-medium">רשימת משתמשים ({users.length})</span>
           </div>
           <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-5 font-medium">שם מלא</th>
                  <th className="p-5 font-medium">שם משתמש</th>
                  <th className="p-5 font-medium">תפקיד</th>
                  <th className="p-5 font-medium text-left pl-8">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users.map((user) => (
                  <tr key={user.username} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-5 text-white font-medium flex items-center gap-3">
                      <div className="bg-slate-700 p-2 rounded-full text-slate-300">
                        <UserIcon size={16} />
                      </div>
                      {user.fullName}
                    </td>
                    <td className="p-5 text-slate-400 font-mono text-sm">{user.username}</td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                        user.role === UserRole.ADMIN 
                        ? 'bg-purple-900/30 text-purple-300 border-purple-500/30' 
                        : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}>
                        {user.role === UserRole.ADMIN ? <Shield size={12} /> : <ShieldAlert size={12} />}
                        {user.role === UserRole.ADMIN ? 'מנהל מערכת' : 'צופה'}
                      </span>
                    </td>
                    <td className="p-5 text-left">
                      {user.username !== 'Niv' && user.username !== currentUser.username && (
                        <button 
                          onClick={() => handleDelete(user.username)}
                          className="text-slate-500 hover:text-red-400 hover:bg-red-900/20 p-2.5 rounded-lg transition-colors"
                          title="מחק משתמש"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
         </div>

         {/* Add Form */}
         <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6 h-fit">
           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
             <UserPlus size={24} className="text-blue-500"/>
             הוספת משתמש חדש
           </h3>
           <form onSubmit={handleAddUser} className="space-y-5">
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">שם מלא</label>
               <input 
                 type="text" 
                 value={newUser.fullName}
                 onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                 className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                 required
                 placeholder="ישראל ישראלי"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">שם משתמש</label>
               <input 
                 type="text" 
                 value={newUser.username}
                 onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                 className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                 required
                 placeholder="user123"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">סיסמה</label>
               <input 
                 type="password" 
                 value={newUser.password}
                 onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                 className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                 required
                 placeholder="******"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">תפקיד</label>
               <select 
                 value={newUser.role}
                 onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                 className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
               >
                 <option value={UserRole.USER}>צופה</option>
                 <option value={UserRole.ADMIN}>מנהל מערכת</option>
               </select>
             </div>
             
             <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 mt-4">
               צור משתמש
             </button>
           </form>
         </div>
       </div>
    </div>
  );
};

export default UsersManager;