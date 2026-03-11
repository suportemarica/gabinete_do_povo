import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, RefreshCw } from 'lucide-react';

interface RateLimitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  retryAfterSeconds: number;
  onRetry: () => void;
}

export function RateLimitDialog({ 
  isOpen, 
  onClose, 
  retryAfterSeconds, 
  onRetry 
}: RateLimitDialogProps) {
  const [timeLeft, setTimeLeft] = useState(retryAfterSeconds);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(retryAfterSeconds);
    setProgress(100);

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        setProgress((newTime / retryAfterSeconds) * 100);
        
        if (newTime <= 0) {
          clearInterval(interval);
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, retryAfterSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    onRetry();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Muitas Tentativas de Login
          </DialogTitle>
          <DialogDescription>
            Você excedeu o limite de tentativas de login. Por favor, aguarde antes de tentar novamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm text-muted-foreground">
              Tempo restante antes de poder tentar novamente
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleRetry} 
              disabled={timeLeft > 0}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p>💡 Dica: Evite fazer muitas tentativas de login rapidamente.</p>
            <p>O sistema permite 100 tentativas a cada 15 minutos por IP.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


