import { useOnline } from '../context/OnlineContext';

export default function OnlineDot({ userId, className = '' }) {
  const onlineIds = useOnline();
  const isOnline  = onlineIds.has(userId);

  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0
      ${isOnline ? 'bg-green-400' : 'bg-gray-600'} ${className}`}/>
  );
}