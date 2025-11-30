import React, { useEffect, useState } from 'react';
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
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface QuestionnaireProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // MODIFIED: Changed the prop signature to match ReportScreen
  onSubmit?: () => void;
  onReportCreated?: (id: string) => void; // <-- NEW: Allows component to pass back a new report ID
  reportId?: string | null; // uuid or bigint string depending on your schema
  userId?: string | null;
  location?: string | null;
  pincode?: string | null;
}

const questions = [
  {
    id: 'q1',
    question: 'How frequently do you use this road?',
    options: ['Daily', 'Weekly', 'Monthly', 'Rarely'],
    type: 'radio' as const,
  },
  {
    id: 'q2',
    question: 'What type of vehicle do you use the MOST on this road?',
    options: [
      'Car',
      'Motorcycle',
      'Bicycle',
      'Bus',
      'Truck',
      'Scooter',
      'Auto Rickshaw',
      'Public Transport',
      'Walking',
      'Other',
    ],
    type: 'radio' as const,
  },
  {
    id: 'q3',
    question: 'What are the issues with this road?',
    options: [
      'Potholes',
      'Cracks',
      'Waterlogging',
      'Poor lighting',
      'Traffic congestion',
      'Unmarked speed bumps',
      'Rough surface',
      'Other',
    ],
    type: 'checkbox' as const,
  },
  {
    id: 'q4',
    question: 'How long has this issue existed?',
    options: ['Less than a month', '1-3 months', '3-6 months', 'More than 6 months'],
    type: 'radio' as const,
  },
  {
    id: 'q5',
    question: 'Has this road been repaired in the past year?',
    options: ['Yes', 'No', 'Not sure'],
    type: 'radio' as const,
  },
];

export function Questionnaire({
  open,
  onOpenChange,
  onSubmit,
  onReportCreated, 
  reportId = null,
  userId = null,
  location = null,
  pincode = null,
}: QuestionnaireProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [additionalComments, setAdditionalComments] = useState('');
  const [saving, setSaving] = useState(false);

  // Use the reportId to create a unique storage key for local persistence
  const storageKey =
    typeof reportId === 'string' && reportId.length > 0
      ? `questionnaire_answers_${reportId}`
      : null;

  // Load answers from localStorage on mount (if reportId is available)
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setAnswers(parsed.answers || {});
        setAdditionalComments(parsed.comments || '');
      }
    } catch (e) {
      console.error('Error loading questionnaire from local storage:', e);
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const resetForm = () => {
    setAnswers({});
    setAdditionalComments('');
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.error('Error removing local storage item:', e);
      }
    }
  };

  const handleRadioChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (id: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const prevArr: string[] = Array.isArray(prev[id]) ? prev[id] : [];
      const nextArr = checked ? [...prevArr, option] : prevArr.filter((o) => o !== option);
      return { ...prev, [id]: nextArr };
    });
  };

  const allQuestionsAnswered = questions.every((q) =>
    q.type === 'checkbox'
      ? answers[q.id] && Array.isArray(answers[q.id]) && answers[q.id].length > 0
      : Boolean(answers[q.id])
  );

  const handleSubmit = async () => {
    if (!allQuestionsAnswered) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    // MANDATORY CHECKS: location and pincode must be present
    if (!location || !pincode) {
      toast.error('Location (user_location) and Pincode (report_pincode) are required to save questionnaire responses.');
      return;
    }

    setSaving(true);

    // ensure we have a logged in user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentUser = session?.user ?? null;
    if (!currentUser && !userId) {
      toast.error('You must be logged in to submit the questionnaire.');
      setSaving(false);
      return;
    }

    const actualUserId = (currentUser?.id as string) || userId!;
    let currentReportId = reportId;
    let isConfirmed = false;
    
    // Step 1: Check Profile Confirmation
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email_confirmed')
        .eq('id', actualUserId)
        .single();

      if (profileErr && profileErr.code !== 'PGRST116') {
        throw new Error('Unable to verify profile confirmation.');
      }
      isConfirmed = !!profileData?.email_confirmed;
    } catch (e) {
      console.error('Profile check error', e);
      toast.error('Unable to verify user profile. Try again later.');
      setSaving(false);
      return;
    }

    // Step 2: Create Report Stub if reportId is missing
    if (!currentReportId) {
      const targetReportTable = isConfirmed ? 'reports' : 'reports_unconfirmed';
      
      // user_pincode = from screen 3 (LocationPermission).
      const userPincode = localStorage.getItem('locationPincode') || null;

      const minimalReportPayload = {
        id: actualUserId, // Using 'id' based on Fix 1 (must match ReportScreen)
        user_pincode: userPincode,
        report_pincode: pincode,
        location: location,
        qsn_answered: true, // Set true immediately
        vote: 'not_rated', // Default value
        files: [], // Default empty array
        created_at: new Date().toISOString(),
      };

      const { data: reportData, error: reportError } = await supabase
        .from(targetReportTable)
        .upsert([minimalReportPayload], { onConflict: 'id' }) 
        .select();

      if (reportError) {
        console.error('Failed to create minimal report stub', reportError);
        toast.error('Failed to start report: ' + (reportError?.message || ''));
        setSaving(false);
        return;
      }

      if (reportData && reportData[0]) {
        currentReportId = reportData[0].id ? String(reportData[0].id) : null;
        if (onReportCreated && currentReportId) {
          onReportCreated(currentReportId); // Notify parent (ReportScreen)
        }
        toast.success(`Report draft created/updated in ${targetReportTable}.`);
      }
    }

    // CRITICAL RE-CHECK: If creating the report stub failed, we cannot proceed.
    if (!currentReportId) {
      toast.error('Failed to establish a report record. Cannot save questionnaire.');
      setSaving(false);
      return;
    }

    // Step 3: Save Questionnaire Responses
    const answersPayload = { ...answers, comments: additionalComments || null };
    
    // This payload contains all data needed for saving the questionnaire responses
    const payloadCommon = {
      report_id: currentReportId, // Use the ID we just created or the existing one
      user_id: actualUserId,
      answers: answersPayload,
      comments: additionalComments || null,
      created_at: new Date().toISOString(),
      // The 'meta' field was removed here as it caused a schema error.
    };

    try {
      if (isConfirmed) {
        // --- Confirmed Path (UPSERT on report_id to prevent duplicates on resubmit) ---
        const { error } = await supabase
          .from('questionnaire_responses_confirmed')
          .upsert(payloadCommon, { onConflict: 'report_id' }); 

        if (error) {
          console.error('Insert confirmed error', error);
          toast.error('Failed to save questionnaire: ' + (error.message || ''));
          setSaving(false);
          return;
        }

        // update reports table's qsn_answered = true
        try {
          const { error: updErr } = await supabase
            .from('reports')
            .update({ qsn_answered: true })
            .eq('id', currentReportId);
          if (updErr) console.warn('Failed to update reports table with questionnaire:', updErr);
        } catch (e) {
          console.error('Exception updating reports table (confirmed):', e);
        }

        toast.success('Questionnaire Submitted Successfully'); // Modified success message
        if (storageKey) localStorage.removeItem(storageKey);
        resetForm();
        onOpenChange(false);
        // Call parent onSubmit to indicate completion
        if (onSubmit) onSubmit();
      } else {
        // --- Unconfirmed Path (UPSERT on report_id to prevent duplicates on resubmit) ---
        const { error } = await supabase
          .from('questionnaire_responses_unconfirmed')
          .upsert(payloadCommon, { onConflict: 'report_id' }); 

        if (error) {
          console.error('Insert unconfirmed error', error);
          toast.error(
            'Failed to save questionnaire (unconfirmed): ' +
              (error.message || '')
          );
          setSaving(false);
          return;
        }

        // update reports_unconfirmed.qsn_answered = true
        try {
          const { error: updErr } = await supabase
            .from('reports_unconfirmed')
            .update({ qsn_answered: true })
            .eq('id', currentReportId);
          if (updErr) console.warn('Failed to update reports_unconfirmed with questionnaire:', updErr);
        } catch (e) {
          console.error('Exception updating reports_unconfirmed table:', e);
        }

        // persist locally so it survives refresh and UI keeps values
        try {
          if (storageKey) {
            localStorage.setItem(
              storageKey,
              JSON.stringify({ answers: payloadCommon.answers, comments: payloadCommon.comments, saved_at: new Date().toISOString() })
            );
          }
        } catch (e) {
          console.error('Error saving questionnaire to local storage:', e);
          // ignore
        }

        // SUCCESS MESSAGE AS TOAST
        toast.success('Kindly Confirm E-mail - Necessary for Report Submission'); 
        // Close the dialog and notify parent of completion
        onOpenChange(false);
        if (onSubmit) onSubmit();
      }
    } catch (e: any) {
      console.error('Questionnaire submit error', e);
      // Fallback error should be generic if we pass the DB check
      toast.error('Unexpected error. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputId = (questionId: string, option: string) =>
    `${questionId}-${option}`.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-]/g, '');

  // Render
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
                <Label className="text-base font-semibold">
                  {index + 1}. {question.question}
                </Label> 

                {question.type === 'radio' ? (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value: string) => handleRadioChange(question.id, value)}
                  >
                    <div className="space-y-2">
                      {question.options.map((option) => {
                        const id = inputId(question.id, option);
                        const selected = answers[question.id] === option;
                        return (
                          <div
                            key={option}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleRadioChange(question.id, option)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRadioChange(question.id, option); } }}
                            className={`flex items-center space-x-3 rounded-lg border-2 p-3 transition-all cursor-pointer ${
                              selected ? 'border-red-500 shadow-sm' : 'border-red-200'
                            }`}
                          >
                            {/* the actual RadioGroupItem remains for accessibility */}
                            <RadioGroupItem value={option} id={id} />
                            <Label htmlFor={id} className="cursor-pointer">
                              {option} 
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>
                ) : (
                  <ScrollArea className="max-h-[240px] pr-3">
                    <div className="space-y-2">
                      {question.options.map((option) => { 
                        const checked = Array.isArray(answers[question.id]) && answers[question.id].includes(option);
                        const id = inputId(question.id, option);
                        return (
                          <div
                            key={option}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleCheckboxChange(question.id, option, !checked)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCheckboxChange(question.id, option, !checked); } }}
                            className={`flex items-center rounded-lg border-2 p-2 md:p-3 transition-colors cursor-pointer ${
                              checked ? 'border-red-500 bg-red-50' : 'border-red-200'
                            }`}
                          >
                            <Checkbox
                              id={id}
                              checked={checked}
                              onCheckedChange={(c: any) => handleCheckboxChange(question.id, option, !!c)}
                            /> 
                            <Label htmlFor={id} className="ml-3 cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            ))}

            <div className="space-y-3">
              <Label htmlFor="comments">Additional Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={additionalComments} 
                placeholder="Share any additional information..."
                onChange={(e) => setAdditionalComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSubmit} disabled={!allQuestionsAnswered || saving}>
            {saving ? 'Saving...' : 'Submit Questionnaire'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Questionnaire;