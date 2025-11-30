import { useState } from 'react';
import { Upload, ThumbsUp, ThumbsDown, FileText, X, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Questionnaire } from './Questionnaire';
import { toast } from 'sonner@2.0.3';

interface ReportScreenProps {
  location: string;
  pincode: string;
  userEmail: string;
  onLogout: () => void;
}

export function ReportScreen({ location, pincode, userEmail, onLogout }: ReportScreenProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [roadCondition, setRoadCondition] = useState<string>('');
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleQuestionnaireSubmit = (answers: Record<string, string>) => {
    console.log('Questionnaire answers:', answers);
    setQuestionnaireCompleted(true);
    toast.success('Questionnaire submitted successfully!');
  };

  const handleSubmitReport = () => {
    if (!roadCondition) {
      toast.error('Please vote for the road condition');
      return;
    }

    if (files.length === 0) {
      toast.error('Please upload at least one photo or video');
      return;
    }

    // Mock submission
    const report = {
      location,
      pincode,
      userEmail,
      roadCondition,
      files: files.map(f => f.name),
      questionnaireCompleted,
      timestamp: new Date().toISOString(),
    };

    console.log('Report submitted:', report);
    
    // Store in localStorage (mock)
    const reports = JSON.parse(localStorage.getItem('reports') || '[]');
    reports.push(report);
    localStorage.setItem('reports', JSON.stringify(reports));

    toast.success('Report submitted successfully!');
    
    // Reset form
    setFiles([]);
    setRoadCondition('');
    setQuestionnaireCompleted(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-600">Logged in as: {userEmail}</div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>

        {/* Location Info */}
        <Card>
          <CardHeader>
            <CardTitle>Report Road Condition</CardTitle>
            <CardDescription>
              Location: {location} (Pincode: {pincode})
            </CardDescription>
          </CardHeader>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Photos/Videos</CardTitle>
            <CardDescription>
              Upload images or videos showing the road condition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">Click to upload photos or videos</div>
                <div className="text-sm text-gray-500 mt-1">
                  PNG, JPG, MP4, MOV up to 50MB
                </div>
              </label>
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      ) : (
                        <Video className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="mt-1 text-sm truncate">{file.name}</div>
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

        {/* Road Condition Vote */}
        <Card>
          <CardHeader>
            <CardTitle>Vote for Road Condition</CardTitle>
            <CardDescription>
              Rate the current condition of the road
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={roadCondition} onValueChange={setRoadCondition}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="excellent" id="excellent" />
                  <Label htmlFor="excellent" className="flex-1 cursor-pointer">
                    <div>Excellent</div>
                    <div className="text-sm text-gray-500">
                      Well-maintained, smooth surface
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="good" id="good" />
                  <Label htmlFor="good" className="flex-1 cursor-pointer">
                    <div>Good</div>
                    <div className="text-sm text-gray-500">
                      Minor issues, mostly driveable
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="fair" id="fair" />
                  <Label htmlFor="fair" className="flex-1 cursor-pointer">
                    <div>Fair</div>
                    <div className="text-sm text-gray-500">
                      Some potholes and cracks present
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="poor" id="poor" />
                  <Label htmlFor="poor" className="flex-1 cursor-pointer">
                    <div>Poor</div>
                    <div className="text-sm text-gray-500">
                      Many potholes, difficult to drive
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="very-poor" id="very-poor" />
                  <Label htmlFor="very-poor" className="flex-1 cursor-pointer">
                    <div>Very Poor</div>
                    <div className="text-sm text-gray-500">
                      Severely damaged, unsafe
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Questionnaire Section */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>
              Help us understand the issue better by answering a few questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setShowQuestionnaire(true)}
              className="w-full"
            >
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

        {/* Submit Button */}
        <Button onClick={handleSubmitReport} className="w-full" size="lg">
          Submit Report
        </Button>
      </div>

      <Questionnaire
        open={showQuestionnaire}
        onOpenChange={setShowQuestionnaire}
        onSubmit={handleQuestionnaireSubmit}
      />
    </div>
  );
}
