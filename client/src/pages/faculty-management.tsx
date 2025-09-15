import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Search, User, Mail, Phone } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const facultySchema = z.object({
  // User details
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  
  // Faculty details
  employeeId: z.string().min(1, "Employee ID is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  specialization: z.array(z.string()).min(1, "At least one specialization is required"),
  maxWeeklyHours: z.number().min(1).max(40).default(15),
  availableDays: z.array(z.string()).min(1, "At least one available day is required"),
});

type FacultyFormData = z.infer<typeof facultySchema>;

export default function FacultyManagement() {
  const [currentRole, setCurrentRole] = useState("admin");
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const { toast } = useToast();

  const { data: facultyList, isLoading: facultyLoading } = useQuery({
    queryKey: ['/api/faculty'],
  });

  const form = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      employeeId: "",
      department: "",
      designation: "",
      specialization: [],
      maxWeeklyHours: 15,
      availableDays: [],
    },
  });

  const createFacultyMutation = useMutation({
    mutationFn: async (data: FacultyFormData) => {
      // First create user
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
        role: "faculty",
        isActive: true,
      };
      
      const userResponse = await apiRequest('POST', '/api/users', userData);
      const user = await userResponse.json();
      
      // Then create faculty profile
      const facultyData = {
        userId: user.id,
        employeeId: data.employeeId,
        department: data.department,
        designation: data.designation,
        specialization: data.specialization,
        maxWeeklyHours: data.maxWeeklyHours,
        availableDays: data.availableDays,
        unavailableSlots: [],
        isActive: true,
      };
      
      const facultyResponse = await apiRequest('POST', '/api/faculty', facultyData);
      return facultyResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faculty'] });
      toast({ title: "Success", description: "Faculty member created successfully" });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create faculty member", variant: "destructive" });
    },
  });

  const deleteFacultyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/faculty/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faculty'] });
      toast({ title: "Success", description: "Faculty member deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete faculty member", variant: "destructive" });
    },
  });

  const handleRoleChange = (role: string) => {
    setCurrentRole(role);
    setLocation(`/${role}`);
  };

  const onSubmit = (data: FacultyFormData) => {
    createFacultyMutation.mutate(data);
  };

  const handleDelete = (facultyId: string) => {
    if (confirm("Are you sure you want to delete this faculty member?")) {
      deleteFacultyMutation.mutate(facultyId);
    }
  };

  const filteredFaculty = facultyList?.filter((faculty: any) => {
    const fullName = `${faculty.firstName || ''} ${faculty.lastName || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         faculty.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faculty.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || faculty.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  }) || [];

  const departments = Array.from(new Set(facultyList?.map((f: any) => f.department) || []));

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const specializations = [
    "Computer Science", "Mathematics", "Physics", "Chemistry", "Biology",
    "Education Technology", "Psychology", "English", "Hindi", "Social Science"
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar currentRole={currentRole} onRoleChange={handleRoleChange} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Faculty Management" 
          breadcrumb={["Admin", "Faculty Management"]} 
        />
        
        <div className="flex-1 overflow-auto p-6 bg-muted/30">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search-faculty"
                />
              </div>
              
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-48" data-testid="select-filter-department">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingFaculty(null);
                    form.reset();
                  }}
                  data-testid="button-add-faculty"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Faculty
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Faculty Member</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-faculty-first-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-faculty-last-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} data-testid="input-faculty-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-faculty-username" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} data-testid="input-faculty-password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Professional Information</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="employeeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee ID</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-faculty-employee-id" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-faculty-department" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="designation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Designation</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-faculty-designation" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="maxWeeklyHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Weekly Hours</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-faculty-max-hours"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Specializations */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Specializations</h3>
                      <FormField
                        control={form.control}
                        name="specialization"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="grid grid-cols-3 gap-2">
                                {specializations.map((spec) => (
                                  <div key={spec} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value?.includes(spec)}
                                      onCheckedChange={(checked) => {
                                        const updated = checked
                                          ? [...(field.value || []), spec]
                                          : field.value?.filter((s) => s !== spec) || [];
                                        field.onChange(updated);
                                      }}
                                      data-testid={`checkbox-specialization-${spec.toLowerCase().replace(/\s+/g, '-')}`}
                                    />
                                    <Label className="text-sm">{spec}</Label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Available Days */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Available Days</h3>
                      <FormField
                        control={form.control}
                        name="availableDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="grid grid-cols-3 gap-2">
                                {days.map((day) => (
                                  <div key={day} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value?.includes(day)}
                                      onCheckedChange={(checked) => {
                                        const updated = checked
                                          ? [...(field.value || []), day]
                                          : field.value?.filter((d) => d !== day) || [];
                                        field.onChange(updated);
                                      }}
                                      data-testid={`checkbox-day-${day}`}
                                    />
                                    <Label className="text-sm capitalize">{day}</Label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddDialogOpen(false)}
                        data-testid="button-cancel-faculty"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createFacultyMutation.isPending}
                        data-testid="button-save-faculty"
                      >
                        Create Faculty
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Faculty Grid */}
          {facultyLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredFaculty.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm || filterDepartment !== "all" 
                  ? "No faculty members found matching your search criteria." 
                  : "No faculty members available. Add your first faculty member to get started."}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFaculty.map((faculty: any) => (
                <Card key={faculty.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {faculty.firstName} {faculty.lastName}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{faculty.employeeId}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(faculty.id)}
                        data-testid={`button-delete-faculty-${faculty.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm space-y-1">
                        <p className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{faculty.email || 'No email'}</span>
                        </p>
                        <p><strong>Department:</strong> {faculty.department}</p>
                        <p><strong>Designation:</strong> {faculty.designation}</p>
                        <p><strong>Max Hours/Week:</strong> {faculty.maxWeeklyHours}</p>
                      </div>
                      
                      {faculty.specialization && faculty.specialization.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Specializations:</p>
                          <div className="flex flex-wrap gap-1">
                            {faculty.specialization.slice(0, 3).map((spec: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                            {faculty.specialization.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{faculty.specialization.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {faculty.availableDays && faculty.availableDays.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Available Days:</p>
                          <div className="flex flex-wrap gap-1">
                            {faculty.availableDays.map((day: string) => (
                              <Badge key={day} variant="outline" className="text-xs capitalize">
                                {day.substring(0, 3)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
