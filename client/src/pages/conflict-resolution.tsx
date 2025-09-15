import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AlertTriangle, CheckCircle, Clock, Search, Filter, ArrowRight } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";
import ConflictModal from "@/components/timetable/conflict-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ConflictResolution() {
  const [currentRole, setCurrentRole] = useState("admin");
  const [, setLocation] = useLocation();
  const [selectedConflict, setSelectedConflict] = useState<any>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("open");
  const [selectedTab, setSelectedTab] = useState("all");
  const { toast } = useToast();

  const { data: conflicts, isLoading: conflictsLoading } = useQuery({
    queryKey: ['/api/conflicts'],
  });

  const { data: timetables } = useQuery({
    queryKey: ['/api/timetables'],
  });

  const resolveConflictMutation = useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: any }) => {
      const response = await apiRequest('PUT', `/api/conflicts/${id}/resolve`, { resolution });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
      toast({ title: "Success", description: "Conflict resolved successfully" });
      setIsConflictModalOpen(false);
      setSelectedConflict(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resolve conflict", variant: "destructive" });
    },
  });

  const handleRoleChange = (role: string) => {
    setCurrentRole(role);
    setLocation(`/${role}`);
  };

  const handleConflictClick = (conflict: any) => {
    setSelectedConflict(conflict);
    setIsConflictModalOpen(true);
  };

  const handleResolveConflict = (solution: any) => {
    if (selectedConflict) {
      resolveConflictMutation.mutate({
        id: selectedConflict.id,
        resolution: solution,
      });
    }
  };

  const filteredConflicts = conflicts?.filter((conflict: any) => {
    const matchesSearch = conflict.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conflict.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || conflict.severity === filterSeverity;
    const matchesStatus = filterStatus === "all" || conflict.status === filterStatus;
    const matchesTab = selectedTab === "all" || conflict.type === selectedTab;
    
    return matchesSearch && matchesSeverity && matchesStatus && matchesTab;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-destructive text-destructive-foreground";
      case "medium": return "bg-accent text-accent-foreground";
      case "low": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-destructive/10 text-destructive";
      case "resolved": return "bg-secondary/10 text-secondary";
      case "ignored": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getConflictIcon = (type: string, status: string) => {
    if (status === "resolved") return CheckCircle;
    if (status === "ignored") return Clock;
    return AlertTriangle;
  };

  const conflictStats = {
    total: conflicts?.length || 0,
    open: conflicts?.filter((c: any) => c.status === "open").length || 0,
    resolved: conflicts?.filter((c: any) => c.status === "resolved").length || 0,
    high: conflicts?.filter((c: any) => c.severity === "high").length || 0,
    medium: conflicts?.filter((c: any) => c.severity === "medium").length || 0,
    low: conflicts?.filter((c: any) => c.severity === "low").length || 0,
  };

  const conflictTypes = Array.from(new Set(conflicts?.map((c: any) => c.type) || []));

  return (
    <div className="min-h-screen flex">
      <Sidebar currentRole={currentRole} onRoleChange={handleRoleChange} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Conflict Resolution" 
          breadcrumb={["Admin", "Conflict Resolution"]} 
        />
        
        <div className="flex-1 overflow-auto p-6 bg-muted/30">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{conflictStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Conflicts</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{conflictStats.open}</div>
                  <div className="text-sm text-muted-foreground">Open</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{conflictStats.resolved}</div>
                  <div className="text-sm text-muted-foreground">Resolved</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{conflictStats.high}</div>
                  <div className="text-sm text-muted-foreground">High Priority</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{conflictStats.medium}</div>
                  <div className="text-sm text-muted-foreground">Medium Priority</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{conflictStats.low}</div>
                  <div className="text-sm text-muted-foreground">Low Priority</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search conflicts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-conflicts"
              />
            </div>
            
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-40" data-testid="select-filter-severity">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-testid="select-filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conflict Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Conflicts</TabsTrigger>
              <TabsTrigger value="room_double_booking">Room Conflicts</TabsTrigger>
              <TabsTrigger value="faculty_overload">Faculty Overload</TabsTrigger>
              <TabsTrigger value="capacity_exceeded">Capacity Issues</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedTab} className="mt-6">
              {/* Conflicts List */}
              {conflictsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredConflicts.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle className="h-16 w-16 text-secondary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {searchTerm || filterSeverity !== "all" || filterStatus !== "all" 
                      ? "No conflicts found" 
                      : "No conflicts detected"}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterSeverity !== "all" || filterStatus !== "all" 
                      ? "Try adjusting your search criteria." 
                      : "Your timetables are optimally scheduled!"}
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredConflicts.map((conflict: any) => {
                    const ConflictIcon = getConflictIcon(conflict.type, conflict.status);
                    return (
                      <Card 
                        key={conflict.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleConflictClick(conflict)}
                        data-testid={`conflict-card-${conflict.id}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className={`p-2 rounded-full ${
                                conflict.status === "resolved" ? "bg-secondary/10" :
                                conflict.severity === "high" ? "bg-destructive/10" :
                                conflict.severity === "medium" ? "bg-accent/10" :
                                "bg-primary/10"
                              }`}>
                                <ConflictIcon className={`h-5 w-5 ${
                                  conflict.status === "resolved" ? "text-secondary" :
                                  conflict.severity === "high" ? "text-destructive" :
                                  conflict.severity === "medium" ? "text-accent" :
                                  "text-primary"
                                }`} />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="text-lg font-semibold text-foreground">
                                    {conflict.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </h3>
                                  <Badge className={getSeverityColor(conflict.severity)}>
                                    {conflict.severity}
                                  </Badge>
                                  <Badge variant="outline" className={getStatusColor(conflict.status)}>
                                    {conflict.status}
                                  </Badge>
                                </div>
                                
                                <p className="text-muted-foreground mb-3">
                                  {conflict.description}
                                </p>
                                
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <span>Created: {new Date(conflict.createdAt).toLocaleDateString()}</span>
                                  {conflict.resolvedAt && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span>Resolved: {new Date(conflict.resolvedAt).toLocaleDateString()}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              {conflict.status === "open" && (
                                <Button 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConflictClick(conflict);
                                  }}
                                  data-testid={`button-resolve-${conflict.id}`}
                                >
                                  Resolve
                                </Button>
                              )}
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          
                          {conflict.resolutionSuggestions && conflict.resolutionSuggestions.length > 0 && (
                            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                              <p className="text-sm font-medium text-foreground mb-2">AI Suggestions:</p>
                              <div className="space-y-1">
                                {conflict.resolutionSuggestions.slice(0, 2).map((suggestion: any, index: number) => (
                                  <p key={index} className="text-sm text-muted-foreground">
                                    • {suggestion.description}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => {
          setIsConflictModalOpen(false);
          setSelectedConflict(null);
        }}
        conflict={selectedConflict}
        onResolve={handleResolveConflict}
      />
    </div>
  );
}
