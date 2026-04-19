'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { Question } from '@/lib/content/guide-content';
import { getAnswerForQuestion, saveAnswer, SavedAnswer } from '@/lib/storage/storage';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ImproveButton from './ImproveButton';

interface QuestionCardProps {
  question: Question;
  onAnswerSaved?: () => void;
}

export default function QuestionCard({ question, onAnswerSaved }: QuestionCardProps) {
  const [answer, setAnswer] = useState('');
  const [savedAnswer, setSavedAnswer] = useState<SavedAnswer | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showImprove, setShowImprove] = useState(false);

  useEffect(() => {
    const existing = getAnswerForQuestion(question.id);
    if (existing) {
      setSavedAnswer(existing);
      setAnswer(existing.answer);
      setIsSaved(true);
    }
  }, [question.id]);

  const handleSave = () => {
    if (!answer.trim()) return;
    
    const revised = savedAnswer !== null;
    saveAnswer(question.id, answer, revised);
    setSavedAnswer({ questionId: question.id, answer: answer.trim(), savedAt: new Date().toISOString(), revisedAfterModel: revised });
    setIsSaved(true);
    onAnswerSaved?.();
  };

  const handleShowModel = () => {
    setShowModelAnswer(!showModelAnswer);
  };

  const handleImproveComplete = (improvedAnswer: string) => {
    setAnswer(improvedAnswer);
    saveAnswer(question.id, improvedAnswer, true);
    setSavedAnswer({ questionId: question.id, answer: improvedAnswer, savedAt: new Date().toISOString(), revisedAfterModel: true });
    setIsSaved(true);
    setShowImprove(false);
  };

  return (
    <Card variant="default" className="mb-6">
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-textPrimary">
            Question {question.id}
          </h3>
          {isSaved && (
            <span className="flex items-center gap-1 text-xs text-correct">
              <CheckCircle className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
        <p className="text-textPrimary leading-relaxed">{question.text}</p>
      </div>
      
      {/* Answer Input */}
      <div className="mb-4">
        <label className="block text-textSecondary text-sm mb-2">Your Answer</label>
        <textarea
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setIsSaved(false);
          }}
          placeholder="Type your answer here... Try to explain in your own words."
          className="w-full p-3 bg-background border border-border rounded-lg text-textPrimary focus:outline-none focus:border-accent resize-y min-h-[120px]"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Button onClick={handleSave} variant="primary" size="sm" disabled={!answer.trim() || (isSaved && answer === savedAnswer?.answer)}>
          <Save className="w-4 h-4 mr-2" />
          Save Answer
        </Button>
        
        <Button onClick={handleShowModel} variant="outline" size="sm">
          {showModelAnswer ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showModelAnswer ? 'Hide' : 'Show'} Model Answer
        </Button>
        
        {isSaved && (
          <ImproveButton
            question={question.text}
            userAnswer={answer}
            modelAnswer={question.modelAnswer}
            onImproveComplete={handleImproveComplete}
            isOpen={showImprove}
            onToggle={() => setShowImprove(!showImprove)}
          />
        )}
      </div>
      
      {/* Model Answer (Toggle) */}
      {showModelAnswer && (
        <div className="mt-4 p-4 bg-correctBg border border-correct/30 rounded-lg animate-fade-in">
          <p className="text-correct text-sm font-medium mb-2">📚 Model Answer:</p>
          <p className="text-textPrimary leading-relaxed">{question.modelAnswer}</p>
          <div className="mt-3 p-2 bg-background/50 rounded">
            <p className="text-textSecondary text-sm">
              <span className="text-warning">💡 Exam Tip:</span> {question.examTip}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}