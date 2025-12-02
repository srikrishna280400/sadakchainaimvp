import React, { useEffect, useState } from 'react';
import { Upload, ThumbsUp, FileText, X, Image, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Questionnaire } from './Questionnaire';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';


interface ReportScreenProps {
  location: string;
  pincode: string;
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
  reportId?: string | null;
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

  // Access control check
  if (!userId) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Card className="w-full max-w-md mx-3 sm:mx-4 shadow-lg">
          <CardHeader className="space-y-0.5 pb-3 sm:pb-4">
            <CardTitle className="text-center text-lg sm:text-2xl text-red-600">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-xs sm:text-sm text-gray-700">
              You must be logged in to submit a report.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft: DraftReport = JSON.parse(raw);
        setFilesNames(draft.filesNames || []);
        setVote(draft.vote || '');
        setQuestionnaireCompleted(!!draft.questionnaireCompleted);
        if (draft.reportId) {
          setReportId(draft.reportId);
        }
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
    if (!vote) {
      toast.error('Please vote for the road condition');
      return;
    }

    if (!userId) {
      toast.error('Not logged in.');
      return;
    }

    setIsSubmitting(true);

    // --- Prepare Metadata & Identifiers ---
    const qsnAnsweredBool = !!questionnaireCompleted;
    const userPincode = localStorage.getItem('locationPincode') || null;
    const reportPincode = pincode || null;
    const finalLocation = location || null;
    
    // Use the actual userId or a fallback for the storage path
    const userIdentifier = userId || 'anon_session';
    const storageBucket = 'reports_media'; // Ensure this bucket exists

    try {
        // --- Step A: File Upload and Public URL Generation (ALWAYS RUNS) ---
        const uploadedFileUrls: string[] = []; // Array to hold public URLs

        for (const file of files) {
            // Generate a unique path using the userIdentifier
            const uniqueFileName = `${userIdentifier}/${reportId || 'draft'}/${Date.now()}-${file.name}`;
            
            // 1. Upload the file
            const { error: uploadError } = await supabase.storage
                .from(storageBucket)
                .upload(uniqueFileName, file,
                  { 
        cacheControl: '3600', 
        upsert: false, 
        // This might resolve issues in some environments:
        contentType: file.type, 
        // Ensure the browser sends the correct content type
    });
       

            if (uploadError) {
                console.error("Storage upload failed:", uploadError);
                // NOTE: We continue even if one file fails, but show an error.
                toast.error(`Failed to upload ${file.name}. Report saving, but missing media.`);
            } else {
                // 2. Get the public URL
                const { data: publicUrlData } = supabase.storage
                    .from(storageBucket)
                    .getPublicUrl(uniqueFileName);
                
                if (publicUrlData?.publicUrl) {
                     uploadedFileUrls.push(publicUrlData.publicUrl);
                }
            }
        }

        // --- Step B: Determine Target Table based on Confirmation Status ---
        let isConfirmed = false;
        const targetReportTable = 'reports_unconfirmed'; // Default to unconfirmed

        if (userId) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('email_confirmed')
                .eq('id', userId)
                .single();
            
            if (profileData?.email_confirmed === true) {
                let isConfirmed = true;
                let targetReportTable = 'reports'; // Change to confirmed table
            }
        }

        // --- Step C: Prepare & Upsert Database Payload (Using Determined Table) ---
        const reportPayload = {
            id: userId, // Assuming 'id' is the primary key for upserting by user ID
            files: uploadedFileUrls, // Contains the full web addresses
            vote: vote,
            qsn_answered: qsnAnsweredBool,
            location: finalLocation,
            report_pincode: reportPincode,
            user_pincode: userPincode,
        };

        const { error: dbError } = await supabase
            .from(targetReportTable)
            .upsert([reportPayload], { onConflict: 'id' });

        if (dbError) {
            throw new Error(`Database update failed: ${dbError.message}`);
        }
        
      setIsSubmitting(false);
      toast.success('Report submitted successfully! Files and data saved.');
      
      // Clear form
      setFiles([]);
      setFilesNames([]);
      setVote('');
      setQuestionnaireCompleted(false);
      clearDraft();
    } catch (e: any) {
      setIsSubmitting(false);
      console.error('Submit report exception', e);
      toast.error('Failed to submit report: ' + (e?.message || String(e)));
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-20">
        <div className="space-y-3 sm:space-y-4">
          
          {/* Location Info Card */}
          <Card className="shadow-lg">
            <CardHeader className="space-y-0.5 pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-2xl">Report Road Condition</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Submit details about the road condition at your selected location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                <div className="text-xs sm:text-sm p-2 sm:p-3 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">Selected Location:</div>
                      <div className="mt-1">{location}</div>
                      <div className="text-xs mt-1 text-blue-600">
                        Report Pincode: {pincode || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="default"
            className="w-full h-8 sm:h-10 text-xs sm:text-base" 
                  onClick={onEditLocation}
                >
                  Edit Location
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Card */}
          <Card className="shadow-lg">
            <CardHeader className="space-y-0.5 pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-2xl">Upload Photos/Videos</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Upload images or videos showing the road condition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                    <div className="mt-2 text-xs sm:text-sm">Click to upload photos or videos</div>
                    <div className="text-xs text-gray-500 mt-1">PNG, JPG, MP4, MOV up to 50MB</div>
                  </label>
                </div>

                {filesNames.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {filesNames.map((name, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                          <Image className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                        </div>
                        <div className="mt-1 text-xs sm:text-sm truncate">{name}</div>
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vote Card */}
          <Card className="shadow-lg">
            <CardHeader className="space-y-0.5 pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-2xl">Vote for Road Condition</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Rate the current condition of the road
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={vote} onValueChange={setVote}>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { value: 'excellent', label: 'Excellent', desc: 'Well-maintained, smooth surface' },
                    { value: 'good', label: 'Good', desc: 'Minor issues, mostly driveable' },
                    { value: 'fair', label: 'Fair', desc: 'Some potholes and cracks present' },
                    { value: 'poor', label: 'Poor', desc: 'Many potholes, difficult to drive' },
                    { value: 'very_poor', label: 'Very Poor', desc: 'Severely damaged, unsafe' },
                  ].map(option => (
                    <div 
                      key={option.value} 
                      className="flex items-center space-x-2 p-2 sm:p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer text-xs sm:text-sm">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.desc}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Questionnaire Card */}
          <Card className="shadow-lg">
            <CardHeader className="space-y-0.5 pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-2xl">Additional Details</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Help us understand the issue better by answering a few questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowQuestionnaire(true)} 
                  className="w-full h-8 sm:h-10 text-xs sm:text-base"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {questionnaireCompleted ? 'Edit Questionnaire' : 'Fill Questionnaire (Optional)'}
                </Button>
                {questionnaireCompleted && (
                  <div className="text-xs sm:text-sm p-2 sm:p-3 rounded-md bg-green-50 text-green-700 border border-green-200 flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 shrink-0" />
                    <span>Questionnaire completed</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmitReport} 
            className="w-full h-8 sm:h-10 text-xs sm:text-base" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </div>

      <Questionnaire
        open={showQuestionnaire}
        onOpenChange={setShowQuestionnaire}
        onSubmit={handleQuestionnaireSubmit}
        onReportCreated={(id) => setReportId(id)}
        reportId={reportId}
        userId={userId}
        location={location}
        pincode={pincode}
      />
    </div>
  );
}

export default ReportScreen;