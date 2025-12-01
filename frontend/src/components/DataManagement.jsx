import { useState, useEffect } from "react";
import { axiosInstance } from "../App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Edit, Trash2, Eye, Filter, Database, History } from "lucide-react";
import SuperAdminPanel from "./SuperAdminPanel";

const DataManagement = ({ user }) => {
  // Show Super Admin Panel ONLY for arjuna@mddrc.com.my
  if (user && user.email === "arjuna@mddrc.com.my") {
    return <SuperAdminPanel />;
  }
  
  // Original Data Management component for other admins
  // Filter state
  const [sessions, setSessions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [programs, setPrograms] = useState([]);
  
  const [filters, setFilters] = useState({
    sessionId: "all",
    companyId: "all",
    programId: "all",
    startDate: "",
    endDate: ""
  });

  // Data state
  const [testResults, setTestResults] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [checklists, setChecklists] = useState([]);
  
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [editDialog, setEditDialog] = useState({ open: false, type: null, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null });
  const [auditDialog, setAuditDialog] = useState({ open: false, type: null, id: null, logs: [] });

  useEffect(() => {
    loadFiltersData();
  }, []);

  const loadFiltersData = async () => {
    try {
      const [sessionsRes, companiesRes, programsRes] = await Promise.all([
        axiosInstance.get("/sessions"),
        axiosInstance.get("/companies"),
        axiosInstance.get("/programs")
      ]);
      setSessions(sessionsRes.data);
      setCompanies(companiesRes.data);
      setPrograms(programsRes.data);
    } catch (error) {
      console.error("Failed to load filter data:", error);
    }
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.sessionId && filters.sessionId !== "all") params.append("session_id", filters.sessionId);
    if (filters.companyId && filters.companyId !== "all") params.append("company_id", filters.companyId);
    if (filters.programId && filters.programId !== "all") params.append("program_id", filters.programId);
    if (filters.startDate) params.append("start_date", filters.startDate);
    if (filters.endDate) params.append("end_date", filters.endDate);
    return params.toString();
  };

  const loadTestResults = async () => {
    setLoading(true);
    try {
      const query = buildQueryString();
      const response = await axiosInstance.get(`/admin/data-management/test-results?${query}`);
      setTestResults(response.data);
    } catch (error) {
      toast.error("Failed to load test results");
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const query = buildQueryString();
      const response = await axiosInstance.get(`/admin/data-management/feedback?${query}`);
      setFeedback(response.data);
    } catch (error) {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const query = buildQueryString();
      const response = await axiosInstance.get(`/admin/data-management/attendance?${query}`);
      setAttendance(response.data);
    } catch (error) {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  const loadChecklists = async () => {
    setLoading(true);
    try {
      const query = buildQueryString();
      const response = await axiosInstance.get(`/admin/data-management/checklists?${query}`);
      setChecklists(response.data);
    } catch (error) {
      toast.error("Failed to load checklists");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type, data) => {
    setEditDialog({ open: true, type, data: { ...data } });
  };

  const handleDelete = (type, id) => {
    setDeleteDialog({ open: true, type, id });
  };

  const confirmDelete = async () => {
    const { type, id } = deleteDialog;
    try {
      await axiosInstance.delete(`/admin/data-management/${type}/${id}`);
      toast.success(`${type} deleted successfully`);
      setDeleteDialog({ open: false, type: null, id: null });
      
      // Reload data
      if (type === "test-results") loadTestResults();
      else if (type === "feedback") loadFeedback();
      else if (type === "attendance") loadAttendance();
      else if (type === "checklists") loadChecklists();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to delete ${type}`);
    }
  };

  const saveEdit = async () => {
    const { type, data } = editDialog;
    try {
      let endpoint = "";
      let payload = {};

      if (type === "test-results") {
        endpoint = `/admin/data-management/test-results/${data.id}`;
        payload = { score: parseFloat(data.score), passed: data.passed };
      } else if (type === "feedback") {
        endpoint = `/admin/data-management/feedback/${data.id}`;
        payload = { responses: data.responses };
      } else if (type === "attendance") {
        endpoint = `/admin/data-management/attendance/${data.id}`;
        payload = { clock_in: data.clock_in, clock_out: data.clock_out };
      } else if (type === "checklists") {
        endpoint = `/admin/data-management/checklists/${data.id}`;
        payload = { items: data.items };
      }

      await axiosInstance.put(endpoint, payload);
      toast.success(`${type} updated successfully`);
      setEditDialog({ open: false, type: null, data: null });

      // Reload data
      if (type === "test-results") loadTestResults();
      else if (type === "feedback") loadFeedback();
      else if (type === "attendance") loadAttendance();
      else if (type === "checklists") loadChecklists();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to update ${type}`);
    }
  };

  const viewAuditLog = async (type, id) => {
    try {
      const response = await axiosInstance.get(`/admin/data-management/audit-logs/${type}/${id}`);
      setAuditDialog({ open: true, type, id, logs: response.data });
    } catch (error) {
      toast.error("Failed to load audit logs");
    }
  };

  const FilterSection = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Search Filters
        </CardTitle>
        <CardDescription>Filter data by session, company, program, or date range</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label>Session</Label>
            <Select value={filters.sessionId} onValueChange={(value) => setFilters({ ...filters, sessionId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Company</Label>
            <Select value={filters.companyId} onValueChange={(value) => setFilters({ ...filters, companyId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Program</Label>
            <Select value={filters.programId} onValueChange={(value) => setFilters({ ...filters, programId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={() => setFilters({ sessionId: "all", companyId: "all", programId: "all", startDate: "", endDate: "" })} variant="outline">
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          Data Management
        </h2>
        <p className="text-muted-foreground">Edit and manage all training data with full audit trail</p>
      </div>

      <FilterSection />

      <Tabs defaultValue="test-results" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="test-results">Test Scores</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
        </TabsList>

        <TabsContent value="test-results" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Test Scores Management</CardTitle>
                  <CardDescription>View, edit, and delete participant test results</CardDescription>
                </div>
                <Button onClick={loadTestResults} disabled={loading}>
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? "Loading..." : "Search"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No test results found. Apply filters and click Search.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{result.participant_name}</div>
                            <div className="text-sm text-muted-foreground">{result.participant_ic}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{result.session_name}</div>
                            <div className="text-sm text-muted-foreground">{result.company_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.test_type || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{result.score?.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge variant={result.passed ? "default" : "destructive"}>
                            {result.passed ? "PASS" : "FAIL"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(result.submitted_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => viewAuditLog("test_result", result.id)}>
                              <History className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit("test-results", result)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete("test-results", result.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Feedback Management</CardTitle>
                  <CardDescription>View, edit, and delete participant feedback</CardDescription>
                </div>
                <Button onClick={loadFeedback} disabled={loading}>
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? "Loading..." : "Search"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {feedback.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No feedback found. Apply filters and click Search.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Responses</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.participant_name}</div>
                            <div className="text-sm text-muted-foreground">{item.participant_ic}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.session_name}</TableCell>
                        <TableCell>{item.company_name}</TableCell>
                        <TableCell>{item.responses?.length || 0} responses</TableCell>
                        <TableCell className="text-sm">{new Date(item.submitted_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => viewAuditLog("feedback", item.id)}>
                              <History className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit("feedback", item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete("feedback", item.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Attendance Management</CardTitle>
                  <CardDescription>View, edit, and delete attendance records</CardDescription>
                </div>
                <Button onClick={loadAttendance} disabled={loading}>
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? "Loading..." : "Search"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No attendance records found. Apply filters and click Search.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.participant_name}</div>
                            <div className="text-sm text-muted-foreground">{record.participant_ic}</div>
                          </div>
                        </TableCell>
                        <TableCell>{record.session_name}</TableCell>
                        <TableCell className="text-sm">{record.clock_in ? new Date(record.clock_in).toLocaleString() : "N/A"}</TableCell>
                        <TableCell className="text-sm">{record.clock_out ? new Date(record.clock_out).toLocaleString() : "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => viewAuditLog("attendance", record.id)}>
                              <History className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit("attendance", record)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete("attendance", record.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklists" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Checklist Management</CardTitle>
                  <CardDescription>View, edit, and delete vehicle checklists</CardDescription>
                </div>
                <Button onClick={loadChecklists} disabled={loading}>
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? "Loading..." : "Search"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {checklists.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No checklists found. Apply filters and click Search.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Trainer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checklists.map((checklist) => (
                      <TableRow key={checklist.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{checklist.participant_name}</div>
                            <div className="text-sm text-muted-foreground">{checklist.participant_ic}</div>
                          </div>
                        </TableCell>
                        <TableCell>{checklist.session_name}</TableCell>
                        <TableCell>{checklist.trainer_name}</TableCell>
                        <TableCell>{checklist.items?.length || 0} items</TableCell>
                        <TableCell className="text-sm">{new Date(checklist.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => viewAuditLog("checklist", checklist.id)}>
                              <History className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit("checklists", checklist)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete("checklists", checklist.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {editDialog.type?.replace("-", " ")}</DialogTitle>
            <DialogDescription>Make changes to the record. This action will be logged in the audit trail.</DialogDescription>
          </DialogHeader>

          {editDialog.type === "test-results" && editDialog.data && (
            <div className="space-y-4">
              <div>
                <Label>Score (%)</Label>
                <Input
                  type="number"
                  value={editDialog.data.score}
                  onChange={(e) => setEditDialog({ ...editDialog, data: { ...editDialog.data, score: e.target.value } })}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editDialog.data.passed}
                  onChange={(e) => setEditDialog({ ...editDialog, data: { ...editDialog.data, passed: e.target.checked } })}
                  className="h-4 w-4"
                />
                <Label>Passed</Label>
              </div>
            </div>
          )}

          {editDialog.type === "attendance" && editDialog.data && (
            <div className="space-y-4">
              <div>
                <Label>Clock In</Label>
                <Input
                  type="datetime-local"
                  value={editDialog.data.clock_in ? new Date(editDialog.data.clock_in).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditDialog({ ...editDialog, data: { ...editDialog.data, clock_in: e.target.value } })}
                />
              </div>
              <div>
                <Label>Clock Out</Label>
                <Input
                  type="datetime-local"
                  value={editDialog.data.clock_out ? new Date(editDialog.data.clock_out).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditDialog({ ...editDialog, data: { ...editDialog.data, clock_out: e.target.value } })}
                />
              </div>
            </div>
          )}

          {editDialog.type === "feedback" && editDialog.data && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Feedback responses: {editDialog.data.responses?.length || 0} items</p>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {editDialog.data.responses?.map((response, index) => (
                  <div key={index} className="border p-3 rounded">
                    <Label className="font-semibold">{response.question}</Label>
                    <Textarea
                      value={response.answer}
                      onChange={(e) => {
                        const newResponses = [...editDialog.data.responses];
                        newResponses[index].answer = e.target.value;
                        setEditDialog({ ...editDialog, data: { ...editDialog.data, responses: newResponses } });
                      }}
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {editDialog.type === "checklists" && editDialog.data && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Checklist items: {editDialog.data.items?.length || 0} items</p>
              <p className="text-sm text-yellow-600">Note: Editing checklist items is complex. Contact support if you need to modify specific items.</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, type: null, data: null })}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {deleteDialog.type?.replace("-", " ")} from the database.
              This action cannot be undone and will be logged in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Audit Log Dialog */}
      <Dialog open={auditDialog.open} onOpenChange={(open) => setAuditDialog({ ...auditDialog, open })}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Audit Trail
            </DialogTitle>
            <DialogDescription>Complete history of all changes made to this record</DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {auditDialog.logs.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No audit logs found</p>
            ) : (
              auditDialog.logs.map((log) => (
                <div key={log.id} className="border p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant={log.action === "delete" ? "destructive" : log.action === "update" ? "default" : "secondary"}>
                        {log.action.toUpperCase()}
                      </Badge>
                      <p className="text-sm font-medium mt-1">{log.user_email}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  {log.changes_summary && (
                    <p className="text-sm text-muted-foreground">{log.changes_summary}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataManagement;
