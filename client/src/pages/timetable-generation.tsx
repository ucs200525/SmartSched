import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Play, Download, Eye, Calendar, Clock, Zap, AlertTriangle } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";
import TimetableGrid from "@/components/timetable/timetable-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";

const timetableSchema = z.object({
  name: z.string().min(1, "Timetable name is required"),
  semester: z.number().min(1).max(8),
  academicYear: z.string().min(1, "Academic year is required"),
  programId: z.string().min(1, "Program is required"),
});

type TimetableFormData = z.infer<typeof timetableSchema>;

export default function TimetableGeneration() {
  const [currentRole, setCurrentRole] = useState("admin");
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: timetables, isLoading: timetablesLoading } = useQuery({
    queryKey: ['/api/timetables'],
  });

  const { data: programs } = useQuery({
    queryKey: ['/api/programs'],
  });

  const { data: conflicts } = useQuery({
    queryKey: ['/api/conflicts', selectedTimetable?.id],
    enabled: !!selectedTimetable?.id,
  });

  const form = useForm<TimetableFormData>({
    resolver: zodResolver(timetableSchema),
    defaultValues: {
      name: "",
      semester: 1,
      academicYear: new Date().getFullYear().toString(),
      programId: "",
    },
  });

  const createTimetableMutation = useMutation({
    mutationFn: async (data: TimetableFormData) => {
      const response = await apiRequest('POST', '/api/timetables', {
        ...data,
        status: 'draft',
      });
      return response.json();
    },
    onSuccess: (newTimetable) => {
      queryClient.invalidateQueries({ queryKey: ['/api/timetables'] });
      toast({ title: "Success", description: "Timetable created successfully" });
      setIsCreateDialogOpen(false);
      setSelectedTimetable(newTimetable);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create timetable", variant: "destructive" });
    },
  });

  const generateTimetableMutation = useMutation({
    mutationFn: async (timetableId: string) => {
      const response = await apiRequest('POST', `/api/timetables/${timetableId}/generate`);
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/timetables'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
      toast({ 
        title: "Generation Complete", 
        description: `Timetable generated with ${result.conflictsFound} conflicts detected` 
      });
      setIsGenerating(false);
      setGenerationProgress(0);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate timetable", variant: "destructive" });
      setIsGenerating(false);
      setGenerationProgress(0);
    },
  });

  const handleRoleChange = (role: string) => {
    setCurrentRole(role);
    setLocation(`/${role}`);
  };

  const onSubmit = (data: TimetableFormData) => {
    createTimetableMutation.mutate(data);
  };

  const handleGenerate = (timetableId: string) => {
    setIsGenerating(true);
    setGenerationProgress(10);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 500);

    generateTimetableMutation.mutate(timetableId);
  };

  const handleExportPDF = () => {
    if (selectedTimetable) {
      exportToPDF(selectedTimetable, `timetable-${selectedTimetable.name}`);
      toast({ title: "Export", description: "PDF export started" });
    }
  };

  const handleExportExcel = () => {
    if (selectedTimetable) {
      exportToExcel(selectedTimetable, `timetable-${selectedTimetable.name}`);
      toast({ title: "Export", description: "Excel export started" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-secondary text-secondary-foreground";
      case "draft": return "bg-muted text-muted-foreground";
      case "archived": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar currentRole={currentRole} onRoleChange={handleRoleChange} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Timetable Generation" 
          breadcrumb={["Admin", "Timetable Generation"]} 
        />
        
        <div className="flex-1 overflow-auto p-6 bg-muted/30">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold">AI-Powered Timetable Generator</h3>
              {selectedTimetable && (
                <Badge className={getStatusColor(selectedTimetable.status)}>
                  {selectedTimetable.status}
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {selectedTimetable && (
                <>
                  <Button 
                    variant="outline"
                    onClick={handleExportPDF}
                    data-testid="button-export-pdf"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleExportExcel}
                    data-testid="button-export-excel"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                </>
              )}
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-timetable">
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Timetable
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Timetable</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timetable Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-timetable-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="semester"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Semester</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-timetable-semester"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="academicYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Academic Year</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-timetable-year" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="programId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Program</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-timetable-program">
                                  <SelectValue placeholder="Select program" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {programs?.map((program: any) => (
                                  <SelectItem key={program.id} value={program.id}>
                                    {program.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                          data-testid="button-cancel-timetable"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createTimetableMutation.isPending}
                          data-testid="button-save-timetable"
                        >
                          Create Timetable
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Timetable List */}
            <div className="xl:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timetables</CardTitle>
                </CardHeader>
                <CardContent>
                  {timetablesLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : timetables?.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No timetables created yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {timetables?.map((timetable: any) => (
                        <div
                          key={timetable.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedTimetable?.id === timetable.id 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedTimetable(timetable)}
                          data-testid={`timetable-item-${timetable.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{timetable.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                Semester {timetable.semester} • {timetable.academicYear}
                              </p>
                            </div>
                            <Badge variant="outline" className={getStatusColor(timetable.status)}>
                              {timetable.status}
                            </Badge>
                          </div>
                          
                          {selectedTimetable?.id === timetable.id && (
                            <div className="mt-3 flex space-x-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerate(timetable.id);
                                }}
                                disabled={isGenerating}
                                data-testid={`button-generate-${timetable.id}`}
                              >
                                <Zap className="h-3 w-3 mr-1" />
                                {isGenerating ? "Generating..." : "Generate"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setLocation("/conflicts")}
                                data-testid={`button-view-conflicts-${timetable.id}`}
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Conflicts
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generation Progress */}
              {isGenerating && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-primary" />
                      AI Generation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{Math.round(generationProgress)}%</span>
                        </div>
                        <Progress value={generationProgress} className="w-full" />
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>• Analyzing course requirements</p>
                        <p>• Checking faculty availability</p>
                        <p>• Optimizing room allocation</p>
                        <p>• Detecting conflicts</p>
                        <p>• Generating final schedule</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conflicts Summary */}
              {selectedTimetable && conflicts && conflicts.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                      Conflicts Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {conflicts.slice(0, 3).map((conflict: any) => (
                        <div key={conflict.id} className="text-sm">
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline" 
                              className={
                                conflict.severity === 'high' ? 'border-destructive text-destructive' :
                                conflict.severity === 'medium' ? 'border-accent text-accent' :
                                'border-primary text-primary'
                              }
                            >
                              {conflict.severity}
                            </Badge>
                            <span className="font-medium">
                              {conflict.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-1">{conflict.description}</p>
                        </div>
                      ))}
                      
                      {conflicts.length > 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation("/conflicts")}
                          className="w-full"
                          data-testid="button-view-all-conflicts"
                        >
                          View All {conflicts.length} Conflicts
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Timetable View */}
            <div className="xl:col-span-3">
              {selectedTimetable ? (
                <TimetableGrid 
                  timetableId={selectedTimetable.id}
                  onCellClick={(entry) => {
                    console.log("Cell clicked:", entry);
                  }}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      No Timetable Selected
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Select a timetable from the list or create a new one to get started.
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      Create Your First Timetable
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
