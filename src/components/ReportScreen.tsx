import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, ThumbsUp, FileText, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Questionnaire } from './Questionnaire';
import { toast } from 'sonner';

interface ReportScreenProps {
  location: string;       // selected location from screen 4
  pincode: string;        // report pincode from screen 4
  userId: string | null;
  onLogout: () => void;
  onEditLocation: () => void;
}

type DraftReport = {
  filesNames: string[];
  vote: string;
  questionnaireCompleted: boolean;
  location: string | null;
  report_pincode: string | null;
  user_pincode: string | null;
  timestamp: string;
  reportId?: string | null; // <-- optional persisted report id
};

const DRAFT_KEY = 'rr_draft_report';

export function ReportScreen({
  location,
  pincode,
  userId,
  onLogout,
  onEditLocation,
}: ReportScreenProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [filesNames, setFilesNames] = useState<string[]>([]);
  const [vote, setVote] = useState<string>('');
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  

  // load draft on mount (restore reportId too)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft: DraftReport = JSON.parse(raw);
        setFilesNames(draft.filesNames || []);
        setVote(draft.vote || '');
        setQuestionnaireCompleted(!!draft.questionnaireCompleted);
        // restore reportId so Questionnaire can update the correct row
        if (draft.reportId) {
          setReportId(draft.reportId);
        }
        // If a draft exists, show the user the reminder message right away as a toast
        toast.info('Kindly Confirm E-mail - Necessary for Report Submission');
      }
    } catch (e) {
      console.warn('Failed to parse draft', e);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
    setFilesNames(prev => [...prev, ...newFiles.map(f => f.name)]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilesNames(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuestionnaireSubmit = () => {
    setQuestionnaireCompleted(true);
    // The success toast is now managed within Questionnaire.tsx
  };

  // check confirmed email (reads profiles.email_confirmed)
  const checkUserConfirmed = async (uid: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email_confirmed')
        .eq('id', uid)
        .single();

      if (error) {
        console.warn('checkUserConfirmed error', error);
        return false;
      }
      return !!(data as any)?.email_confirmed;
    } catch (e) {
      console.error('checkUserConfirmed exception', e);
      return false;
    }
  };

  const saveDraftToLocalStorage = (payload: DraftReport) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save draft', e);
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      /* ignore */
    }
  };

  const handleSubmitReport = async () => {
    // This check is correct as per your requirement
    if (!vote) {
      toast.error('Please vote for the road condition');
      return;
    }

    if (!userId) {
      toast.error('Not logged in.');
      return;
    }

    setIsSubmitting(true);

    // final arrays/names to save
    const filesToSave = filesNames.length ? filesNames : (files.length ? files.map(f => f.name) : []);
    const qsnAnsweredBool = !!questionnaireCompleted;

    // user_pincode = from screen 3 (LocationPermission). We read localStorage key 'locationPincode'.
    const userPincode = localStorage.getItem('locationPincode') || null;
    // report_pincode = pincode prop from screen 4 (selected location)
    const reportPincode = pincode || null;

    const finalLocation = location || null;

    try {
      const confirmed = await checkUserConfirmed(userId);

      const payloadCommon: any = {
        id: userId, // Primary key for reports_unconfirmed
        user_pincode: userPincode,
        report_pincode: reportPincode,
        location: finalLocation,
        qsn_answered: qsnAnsweredBool, 
        vote,
        files: filesToSave,
        created_at: new Date().toISOString(),
      };

      if (confirmed) {
        // confirmed -> insert into reports
        // NOTE: If this fails on duplicate key on resubmit, we would need to switch this to upsert too,
        // but typically confirmed reports are treated as final submissions. Keeping as insert for now.
        const { data, error } = await supabase
          .from('reports')
          .insert([payloadCommon])
          .select();

        setIsSubmitting(false);

        if (!error && data && data[0]) {
          const createdId = data[0].id ? String(data[0].id) : null;
          setReportId(createdId);
          toast.success('Report submitted successfully!');

          // clear screen + draft
          setFiles([]);
          setFilesNames([]);
          setVote('');
          setQuestionnaireCompleted(false);
          clearDraft();
        } else {
          console.error('Failed saving confirmed report', error);
          toast.error('Failed to save report: ' + (error?.message || ''));
        }
      } else {
        // unconfirmed -> UPSERT into reports_unconfirmed
        const { data, error } = await supabase
          .from('reports_unconfirmed')
          .upsert([payloadCommon], { onConflict: 'id' }) 
          .select();

        setIsSubmitting(false);

        if (!error && data && data[0]) {
          const createdId = data[0].id ? String(data[0].id) : null;
          setReportId(createdId);

          // Save draft — IMPORTANT: include reportId so questionnaire can update this row after reload
          const draft: DraftReport = {
            filesNames: filesToSave,
            vote,
            questionnaireCompleted: qsnAnsweredBool,
            location: finalLocation,
            report_pincode: reportPincode,
            user_pincode: userPincode,
            timestamp: new Date().toISOString(),
            reportId: createdId,
          };
          saveDraftToLocalStorage(draft);

          // SUCCESS MESSAGE AS TOAST
          toast.success('Kindly Confirm E-mail - Necessary for Report Submission');
          
          // Force reload so the UI shows the banner and the draft is re-read on mount.
          // small delay to ensure localStorage flush
          setTimeout(() => {
            try {
              window.location.reload();
            } catch (e) {
              console.warn('Reload failed', e);
            }
          }, 150);
        } else {
          console.error('Failed saving unconfirmed report', error);
          toast.error('Failed to save draft report: ' + (error?.message || ''));
        }
      }
    } catch (e: any) {
      setIsSubmitting(false);
      console.error('Submit report exception', e);
      toast.error('Failed to submit report: ' + (e?.message || String(e)));
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center">
      {/* Changes:
        - my-6 -> my-8 (offset from top/bottom screen edges)
        - py-8 -> py-10 (increase inner top/bottom padding)
        - space-y-6 -> space-y-4 (reduce vertical space between cards and button)
      */}
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 w-full max-w-3xl h-full mx-auto my-8 flex flex-col overflow-y-auto px-3 py-10 pb-32 space-y-4">
        
        {/* Location Info + Edit button (two-column) */}
        {/* Change items-start to items-center for vertical alignment (Change 3) */}
        <div className="w-full flex items-center justify-between gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Report Road Condition</CardTitle>
              <CardDescription className="whitespace-pre-wrap">
                Location: {location}
                {"\n"}
                (report pincode: {pincode})
                {" — user pincode (screen 3): "}{localStorage.getItem('locationPincode') || 'N/A'}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Rectangular card for the edit button, aligned to the right (Change 4) */}
          <div className="w-[220px] shrink-0">
            {/* The button now takes the place and styling of the inner border box */}
            <Button
              // Use default styling but apply custom classes to match the look of the previous container
              className="w-full h-full bg-white text-gray-800 shadow-sm border border-blue-200 rounded-xl hover:bg-gray-50 transition-colors"
              onClick={() => {
                // call parent handler to go back to location search
                try { onEditLocation(); } catch (e) { console.warn('onEditLocation missing', e); }
              }}
            >
              Edit Location
            </Button>
          </div>
        </div>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Photos/Videos</CardTitle>
            <CardDescription>Upload images or videos showing the road condition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/,video/"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">Click to upload photos or videos</div>
                <div className="text-sm text-gray-500 mt-1">PNG, JPG, MP4, MOV up to 50MB</div>
              </label>
            </div>

            {filesNames.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filesNames.map((name, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="mt-1 text-sm truncate">{name}</div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vote */}
        <Card>
          <CardHeader>
            <CardTitle>Vote for Road Condition</CardTitle>
            <CardDescription>Rate the current condition of the road</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={vote} onValueChange={setVote}>
              <div className="space-y-3">
                {[
                  { value: 'excellent', label: 'Excellent', desc: 'Well-maintained, smooth surface' },
                  { value: 'good', label: 'Good', desc: 'Minor issues, mostly driveable' },
                  { value: 'fair', label: 'Fair', desc: 'Some potholes and cracks present' },
                  { value: 'poor', label: 'Poor', desc: 'Many potholes, difficult to drive' },
                  { value: 'very_poor', label: 'Very Poor', desc: 'Severely damaged, unsafe' },
                ].map(option => (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      <div>{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Questionnaire */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>Help us understand the issue better by answering a few questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setShowQuestionnaire(true)} className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              {questionnaireCompleted ? 'Edit Questionnaire' : 'Fill Questionnaire (Optional)'}
            </Button>
            {questionnaireCompleted && (
              <div className="mt-2 text-sm text-green-600 flex items-center">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Questionnaire completed
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <Button onClick={handleSubmitReport} className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </Button>

        <div className="h-96 shrink-0"></div>

        <Questionnaire
          open={showQuestionnaire}
          onOpenChange={setShowQuestionnaire}
          onSubmit={() => handleQuestionnaireSubmit()}
          onReportCreated={(id) => setReportId(id)}
          reportId={reportId}
          userId={userId}
          location={location}
          pincode={pincode}
        />
      </div>
    </div>
  );
}

export default ReportScreen;