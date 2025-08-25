import { useI18n } from '../contexts/I18nContext';
import { Card, CardContent } from './ui/card';

interface WaitingForOthersTimerProps {
  className?: string;
  playerName: string;
}

export const WaitingForOthersTimer = ({ className = '', playerName }: WaitingForOthersTimerProps) => {
  const { t } = useI18n();

  return (
    <Card className={`text-center ${className}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Waiting indicator */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full animate-pulse"
              style={{ width: '100%' }}
            />
          </div>
          
          {/* Waiting message */}
          <div className="space-y-2">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t('waitingForOthers')}
            </p>
            <div className="text-4xl font-bold text-blue-500">
              ⏳
            </div>
            <p className="text-sm text-gray-500">
              {t('othersHaveTimeToFinish')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
