import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../services/api';

const initials = (name) =>
  name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

export default function MembersPanel({ group }) {
  const { user }  = useAuth();
  const isTeacher = group?.my_role === 'teacher';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    if (!group) return;
    setLoading(true);
    groupsAPI.get(group.id)
      .then(res => setMembers(res.data.members || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [group?.id]);

  const teachers = members.filter(m => m.role === 'teacher');
  const students = members.filter(m => m.role === 'student');

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-950">

      {/* Invite code section — teachers only */}
      {isTeacher && (
        <div className="mx-5 mt-5 p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-xs text-gray-500 mb-2">Share this code to invite students</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-semibold text-indigo-400 tracking-widest">
              {group.invite_code}
            </span>
            <button onClick={copyInviteCode}
              className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition">
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-800 animate-pulse flex-shrink-0"/>
                <div className="h-4 bg-gray-800 rounded animate-pulse w-32"/>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Teachers */}
            {teachers.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-3">
                  Teachers · {teachers.length}
                </p>
                <div className="space-y-2">
                  {teachers.map(m => (
                    <MemberRow
                      key={m.users?.id}
                      member={m}
                      isCurrentUser={m.users?.id === user?.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Students */}
            {students.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-3">
                  Students · {students.length}
                </p>
                <div className="space-y-2">
                  {students.map(m => (
                    <MemberRow
                      key={m.users?.id}
                      member={m}
                      isCurrentUser={m.users?.id === user?.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MemberRow({ member, isCurrentUser }) {
  const u = member.users;
  if (!u) return null;

  const colors = [
    'bg-indigo-600', 'bg-teal-600', 'bg-purple-600',
    'bg-pink-600', 'bg-amber-600', 'bg-green-600'
  ];
  const color = colors[u.name?.charCodeAt(0) % colors.length];

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-900 transition">
      <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}>
        {initials(u.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">
          {u.name}
          {isCurrentUser && (
            <span className="ml-2 text-xs text-gray-600">(you)</span>
          )}
        </p>
        <p className="text-xs text-gray-600 truncate">{u.email || u.phone}</p>
      </div>
    </div>
  );
}