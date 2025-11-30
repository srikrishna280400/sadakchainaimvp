import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';

interface QuestionnaireProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (answers: Record<string, string>) => void;
}

const questions = [
  {
    id: 'q1',
    question: 'How frequently do you use this road?',
    options: ['Daily', 'Weekly', 'Monthly', 'Rarely'],
  },
  {
    id: 'q2',
    question: 'What type of vehicle do you use on this road?',
    options: ['Car', 'Motorcycle', 'Bicycle', 'Public Transport', 'Walking'],
  },
  {
    id: 'q3',
    question: 'What is the primary issue with this road?',
    options: ['Potholes', 'Cracks', 'Waterlogging', 'Poor lighting', 'Traffic congestion', 'Other'],
  },
  {
    id: 'q4',
    question: 'How long has this issue existed?',
    options: ['Less than a month', '1-3 months', '3-6 months', 'More than 6 months'],
  },
  {
    id: 'q5',
    question: 'Has this road been repaired in the past year?',
    options: ['Yes', 'No', 'Not sure'],
  },
];

export function Questionnaire({ open, onOpenChange, onSubmit }: QuestionnaireProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [additionalComments, setAdditionalComments] = useState('');

  const handleSubmit = () => {
    const allAnswers = {
      ...answers,
      additionalComments,
    };
    onSubmit(allAnswers);
    setAnswers({});
    setAdditionalComments('');
    onOpenChange(false);
  };

  const allQuestionsAnswered = questions.every(q => answers[q.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Road Condition Questionnaire</DialogTitle>
          <DialogDescription>
            Please answer the following questions to help us better understand the road condition
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <Label>
                  {index + 1}. {question.question}
                </Label>
                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) =>
                    setAnswers({ ...answers, [question.id]: value })
                  }
                >
                  {question.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                      <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}

            <div className="space-y-3">
              <Label htmlFor="comments">Additional Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Share any additional information..."
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!allQuestionsAnswered}>
            Submit Questionnaire
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
