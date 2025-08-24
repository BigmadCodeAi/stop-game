import { useEffect, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { Progress } from './ui/progress';

interface VotingTimerProps {
  seconds: number;
  onTimeUp: () => void;
  className?: string;
}

export const VotingTimer = ({ seconds, onTimeUp, className = '' }: VotingTimerProps) => {
  const { t } = useI18n();
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onTimeUp]);

  // Calculate progress percentage
  const progress = ((seconds - timeLeft) / seconds) * 100;

  // Determine color based on time left
  const getProgressColor = () => {
    if (timeLeft <= 5) return 'bg-red-500';
    if (timeLeft <= 10) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">
            {t('votingTimeLeft')}
          </span>
          <span className={`font-bold ${timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-yellow-500' : 'text-green-500'}`}>
            {timeLeft}s
          </span>
        </div>
        <Progress 
          value={progress} 
          className="h-2"
        />
      </div>
      {timeLeft <= 5 && (
        <div className="text-xs text-red-500 font-medium">
          {t('autoSubmit')}
        </div>
      )}
    </div>
  );
};
