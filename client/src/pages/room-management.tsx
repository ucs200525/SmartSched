import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Search, Building, Users, Monitor } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const roomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  code: z.string().min(1, "Room code is required"),
  type: z.enum(["classroom", "lab", "hall", "auditorium"]),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  building: z.string().min(1, "Building is required"),
  floor: z.number().min(0, "Floor must be 0 or greater"),
  equipment: z.array(z.string()).optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

export default function RoomManagement() {
  const [currentRole, setCurrentRole] = useState("admin");
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterBuilding, setFilterBuilding] = useState("all");
  const { toast } = useToast();

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['/api/rooms'],
  });

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "classroom",
      capacity: 50,
      building: "",
      floor: 0,
      equipment: [],
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      const response = await apiRequest('POST', '/api/rooms', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      toast({ title: "Success", description: "Room created successfully" });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create room", variant: "destructive" });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RoomFormData> }) => {
      const response = await apiRequest('PUT', `/api/rooms/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      toast({ title: "Success", description: "Room updated successfully" });
      setEditingRoom(null);
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update room", variant: "destructive" });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      toast({ title: "Success", description: "Room deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete room", variant: "destructive" });
    },
  });

  const handleRoleChange = (role: string) => {
    setCurrentRole(role);
    setLocation(`/${role}`);
  };

  const onSubmit = (data: RoomFormData) => {
    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, data });
    } else {
      createRoomMutation.mutate(data);
    }
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    form.reset({
      name: room.name,
      code: room.code,
      type: room.type,
      capacity: room.capacity,
      building: room.building,
      floor: room.floor || 0,
      equipment: room.equipment || [],
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (roomId: string) => {
    if (confirm("Are you sure you want to delete this room?")) {
      deleteRoomMutation.mutate(roomId);
    }
  };

  const filteredRooms = rooms?.filter((room: any) => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || room.type === filterType;
    const matchesBuilding = filterBuilding === "all" || room.building === filterBuilding;
    return matchesSearch && matchesType && matchesBuilding;
  }) || [];

  const buildings = Array.from(new Set(rooms?.map((r: any) => r.building) || []));

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "classroom": return Building;
      case "lab": return Monitor;
      case "hall": return Users;
      case "auditorium": return Users;
      default: return Building;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "classroom": return "bg-blue-100 text-blue-800";
      case "lab": return "bg-green-100 text-green-800";
      case "hall": return "bg-orange-100 text-orange-800";
      case "auditorium": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const equipmentOptions = [
    "Projector", "Whiteboard", "Smart Board", "Audio System", "Microphone",
    "Computer", "WiFi", "Air Conditioning", "Laboratory Equipment", "Podium"
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar currentRole={currentRole} onRoleChange={handleRoleChange} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Room & Lab Management" 
          breadcrumb={["Admin", "Room Management"]} 
        />
        
        <div className="flex-1 overflow-auto p-6 bg-muted/30">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search-rooms"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48" data-testid="select-filter-type">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="classroom">Classroom</SelectItem>
                  <SelectItem value="lab">Laboratory</SelectItem>
                  <SelectItem value="hall">Hall</SelectItem>
                  <SelectItem value="auditorium">Auditorium</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBuilding} onValueChange={setFilterBuilding}>
                <SelectTrigger className="w-48" data-testid="select-filter-building">
                  <SelectValue placeholder="Filter by Building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buildings</SelectItem>
                  {buildings.map((building) => (
                    <SelectItem key={building} value={building}>
                      {building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingRoom(null);
                    form.reset();
                  }}
                  data-testid="button-add-room"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRoom ? "Edit Room" : "Add New Room"}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-room-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Code</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-room-code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-room-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="classroom">Classroom</SelectItem>
                                <SelectItem value="lab">Laboratory</SelectItem>
                                <SelectItem value="hall">Hall</SelectItem>
                                <SelectItem value="auditorium">Auditorium</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-room-capacity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="floor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Floor</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-room-floor"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="building"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Building</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-room-building" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Equipment */}
                    <div className="space-y-3">
                      <FormLabel>Equipment & Facilities</FormLabel>
                      <FormField
                        control={form.control}
                        name="equipment"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="grid grid-cols-2 gap-2">
                                {equipmentOptions.map((equipment) => (
                                  <div key={equipment} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value?.includes(equipment)}
                                      onCheckedChange={(checked) => {
                                        const updated = checked
                                          ? [...(field.value || []), equipment]
                                          : field.value?.filter((e) => e !== equipment) || [];
                                        field.onChange(updated);
                                      }}
                                      data-testid={`checkbox-equipment-${equipment.toLowerCase().replace(/\s+/g, '-')}`}
                                    />
                                    <Label className="text-sm">{equipment}</Label>
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
                        data-testid="button-cancel-room"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
                        data-testid="button-save-room"
                      >
                        {editingRoom ? "Update" : "Create"} Room
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Rooms Grid */}
          {roomsLoading ? (
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
          ) : filteredRooms.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm || filterType !== "all" || filterBuilding !== "all" 
                  ? "No rooms found matching your search criteria." 
                  : "No rooms available. Create your first room to get started."}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room: any) => {
                const TypeIcon = getTypeIcon(room.type);
                return (
                  <Card key={room.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <TypeIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{room.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{room.code}</p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(room)}
                            data-testid={`button-edit-room-${room.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(room.id)}
                            data-testid={`button-delete-room-${room.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getTypeColor(room.type)}>
                            {room.type}
                          </Badge>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{room.capacity}</span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Building:</strong> {room.building}</p>
                          <p><strong>Floor:</strong> {room.floor || 0}</p>
                        </div>

                        {room.equipment && room.equipment.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Equipment:</p>
                            <div className="flex flex-wrap gap-1">
                              {room.equipment.slice(0, 3).map((equipment: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {equipment}
                                </Badge>
                              ))}
                              {room.equipment.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{room.equipment.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
