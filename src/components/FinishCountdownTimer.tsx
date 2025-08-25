import { useEffect, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { Card, CardContent } from './ui/card';

interface FinishCountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  className?: string;
  playerName: string;
}

export const FinishCountdownTimer = ({ seconds, onComplete, className = '', playerName }: FinishCountdownTimerProps) => {
  const { t } = useI18n();
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);

  // Calculate progress percentage for visual indicator
  const progress = ((seconds - timeLeft) / seconds) * 100;

  return (
    <Card className={`text-center ${className}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Countdown text */}
          <div className="space-y-2">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t('someoneFinished', { playerName })}
            </p>
            <div className="text-6xl font-bold text-red-500">
              {timeLeft}
            </div>
            <p className="text-sm text-gray-500">
              {t('finishCountdown', { seconds: timeLeft })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
