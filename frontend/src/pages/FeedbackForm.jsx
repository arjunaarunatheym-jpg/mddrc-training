import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Star, Send } from "lucide-react";

const FeedbackForm = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState({});

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const sessionResponse = await axiosInstance.get(`/sessions/${sessionId}`);
      setSession(sessionResponse.data);
      
      // Try to load feedback template for the program
      let feedbackTemplate = null;
      try {
        const templateResponse = await axiosInstance.get(`/feedback/templates/program/${sessionResponse.data.program_id}`);
        // API returns array, get first template
        const templates = templateResponse.data;
        if (templates && templates.length > 0) {
          feedbackTemplate = templates[0];
        }
      } catch (templateError) {
        console.log("No custom template found, using defaults");
      }
      
      // If no custom template, use default questions
      if (!feedbackTemplate || !feedbackTemplate.questions) {
        feedbackTemplate = {
          program_id: sessionResponse.data.program_id,
          questions: [
            { question: "Overall Training Experience", type: "rating", required: true },
            { question: "Training Content Quality", type: "rating", required: true },
            { question: "Trainer Effectiveness", type: "rating", required: true },
            { question: "Venue & Facilities", type: "rating", required: true },
            { question: "Suggestions for Improvement", type: "text", required: false },
            { question: "Additional Comments", type: "text", required: false }
          ]
        };
      }
      
      setTemplate(feedbackTemplate);
      
      // Initialize responses
      const initialResponses = {};
      if (feedbackTemplate.questions && Array.isArray(feedbackTemplate.questions)) {
        feedbackTemplate.questions.forEach((q, index) => {
          initialResponses[index] = q.type === "rating" ? 0 : "";
        });
      }
      setResponses(initialResponses);
      
      setLoading(false);
    } catch (error) {
      console.error("Feedback form error:", error);
      console.error("Error response:", error.response);
      const errorMsg = error.response?.data?.detail || error.message || "Failed to load session details";
      toast.error(`Failed to load session details: ${errorMsg}`);
      navigate("/participant");
    }
  };

  const handleResponseChange = (index, value) => {
    setResponses({ ...responses, [index]: value });
  };

  const handleSubmit = async () => {
    // Validate required fields
    const invalidField = template.questions.findIndex((q, idx) => {
      if (!q.required) return false;
      if (q.type === "rating") return responses[idx] === 0;
      return !responses[idx] || responses[idx].trim() === "";
    });

    if (invalidField !== -1) {
      toast.error(`Please complete question ${invalidField + 1}`);
      return;
    }

    setSubmitting(true);
    try {
      const formattedResponses = template.questions.map((q, idx) => ({
        question: q.question,
        answer: responses[idx]
      }));

      await axiosInstance.post("/feedback/submit", {
        session_id: sessionId,
        program_id: session.program_id,
        feedback_template_id: template.id || null,
        responses: formattedResponses
      });
      
      // Set flag to trigger data reload on participant dashboard
      sessionStorage.setItem('feedbackSubmitted', 'true');
      
      toast.success("Feedback submitted successfully! You can now access your certificate.");
      navigate("/participant");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit feedback");
      setSubmitting(false);
    }
  };

  const RatingStars = ({ label, value, field }) => (
    <div className="space-y-2">
      <Label className="text-base font-medium">{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingClick(field, star)}
            className="transition-transform hover:scale-110"
            type="button"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-gray-600">{value > 0 ? `${value}/5` : "Not rated"}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/participant")}
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Training Feedback</h1>
          <p className="text-gray-600">{session?.name}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Feedback Matters</CardTitle>
            <CardDescription>
              Help us improve our training programs by sharing your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {template?.questions.map((question, index) => (
              <div key={index} className="space-y-2">
                <Label className="text-base font-medium">
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                {question.type === "rating" ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleResponseChange(index, star)}
                        className="transition-transform hover:scale-110"
                        type="button"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= responses[index]
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-gray-600">
                      {responses[index] > 0 ? `${responses[index]}/5` : "Not rated"}
                    </span>
                  </div>
                ) : (
                  <Textarea
                    value={responses[index] || ""}
                    onChange={(e) => handleResponseChange(index, e.target.value)}
                    placeholder="Enter your response..."
                    rows={4}
                    data-testid={`response-${index}`}
                  />
                )}
              </div>
            ))}

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                size="lg"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                data-testid="submit-feedback-button"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
              <p className="text-sm text-gray-500 text-center mt-3">
                After submitting feedback, your certificate will be available for download
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackForm;
