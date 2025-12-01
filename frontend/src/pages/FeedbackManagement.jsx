import { useState, useEffect } from "react";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Save, ArrowLeft, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const FeedbackManagement = ({ program, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [program.id]);

  const loadTemplate = async () => {
    try {
      const response = await axiosInstance.get(`/feedback-templates/program/${program.id}`);
      if (response.data && response.data.questions) {
        setQuestions(response.data.questions || []);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      // No template exists yet
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        type: "rating",
        required: true
      }
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const saveTemplate = async () => {
    // Validate
    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    const emptyQuestion = questions.find(q => !q.question.trim());
    if (emptyQuestion) {
      toast.error("Please fill in all question fields");
      return;
    }

    try {
      await axiosInstance.post("/feedback-templates", {
        program_id: program.id,
        questions: questions
      });
      
      toast.success("Feedback template saved successfully!");
    } catch (error) {
      console.error('Save error:', error);
      const errorMsg = error.response?.data?.detail || "Failed to save feedback template";
      toast.error(errorMsg);
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('program_id', program.id);

      const response = await axiosInstance.post('/feedback-templates/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { total_uploaded, warnings } = response.data;
      
      let message = `✓ Successfully uploaded ${total_uploaded} feedback question(s)!`;
      if (warnings) {
        message += `\n⚠ ${warnings}`;
      }
      
      toast.success(message);
      setUploadDialogOpen(false);
      loadTemplate();
      
      e.target.value = '';
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to upload file";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Feedback Form - {program.name}</CardTitle>
            <CardDescription>Create custom feedback questions for participants</CardDescription>
          </div>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Programs
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Bulk Upload Option */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)} className="w-full sm:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Upload Feedback Questions</DialogTitle>
                <DialogDescription>
                  Upload an Excel file (.xlsx or .xls) with feedback questions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-blue-900">Excel Format Required:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Column 1: <strong>Question Text</strong></li>
                    <li>• Column 2: <strong>Type</strong> (rating or text)</li>
                    <li>• Column 3: <strong>Required</strong> (yes or no)</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-2">
                    Note: Questions will be automatically assigned to program: <strong>{program.name}</strong>
                  </p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-sm text-gray-600">
                      {uploading ? "Uploading..." : "Click to select Excel file"}
                    </span>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleBulkUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Questions List */}
          {questions.map((question, index) => (
            <Card key={index} className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Question {index + 1}</h3>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteQuestion(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div>
                    <Label>Question Text</Label>
                    <Input
                      value={question.question}
                      onChange={(e) => updateQuestion(index, "question", e.target.value)}
                      placeholder="Enter your feedback question"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={question.type}
                        onValueChange={(value) => updateQuestion(index, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Rating (1-5 stars)</SelectItem>
                          <SelectItem value="text">Text (Open-ended)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-8">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={question.required}
                        onChange={(e) => updateQuestion(index, "required", e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`required-${index}`}>Required</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Question Button */}
          <Button
            onClick={addQuestion}
            variant="outline"
            className="w-full border-dashed border-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>

          {/* Save Button */}
          <Button
            onClick={saveTemplate}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={questions.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Feedback Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackManagement;