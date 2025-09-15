import { useState } from "react";
import { X, CheckCircle } from "lucide-react";

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict?: any;
  onResolve?: (solution: any) => void;
}

export default function ConflictModal({ 
  isOpen, 
  onClose, 
  conflict, 
  onResolve 
}: ConflictModalProps) {
  const [selectedSolution, setSelectedSolution] = useState<any>(null);

  if (!isOpen || !conflict) return null;

  const solutions = [
    {
      id: 1,
      title: "Move Psychology to Room 305",
      description: "Available room with 60 capacity, same time slot",
      benefits: ["No additional conflicts", "Adequate capacity", "Same building"],
      type: "recommended",
    },
    {
      id: 2,
      title: "Move Language Skills to 9:30-10:25",
      description: "Shift to next available slot, same room",
      benefits: ["No room change needed"],
      warnings: ["May affect Prof. Rita's other classes"],
      type: "alternative",
    },
    {
      id: 3,
      title: "Split Language Skills into two sections",
      description: "Create 2 sections of 22-23 students each",
      benefits: ["Smaller class sizes"],
      warnings: ["Requires additional faculty time"],
      type: "complex",
    },
  ];

  const handleApplyRecommended = () => {
    const recommendedSolution = solutions.find(s => s.type === "recommended");
    if (recommendedSolution && onResolve) {
      onResolve(recommendedSolution);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Resolve {conflict.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </h3>
          <button 
            className="p-2 hover:bg-muted rounded-md" 
            onClick={onClose}
            data-testid="button-close-conflict-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Conflict Details */}
            <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <h4 className="font-semibold text-foreground mb-2">Conflict Details</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Type:</span> {conflict.type}</p>
                <p><span className="font-medium">Severity:</span> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    conflict.severity === 'high' ? 'bg-destructive text-destructive-foreground' :
                    conflict.severity === 'medium' ? 'bg-accent text-accent-foreground' :
                    'bg-primary text-primary-foreground'
                  }`}>
                    {conflict.severity}
                  </span>
                </p>
                <p><span className="font-medium">Description:</span> {conflict.description}</p>
              </div>
            </div>
            
            {/* AI Suggestions */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">AI Suggested Solutions</h4>
              <div className="space-y-3">
                {solutions.map((solution) => (
                  <div
                    key={solution.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSolution?.id === solution.id
                        ? "border-primary bg-primary/5"
                        : solution.type === "recommended"
                        ? "border-secondary/20 bg-secondary/5 hover:bg-secondary/10"
                        : "border-input hover:bg-muted"
                    }`}
                    onClick={() => setSelectedSolution(solution)}
                    data-testid={`solution-${solution.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-foreground">{solution.title}</h5>
                        <p className="text-sm text-muted-foreground mt-1">{solution.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                          {solution.benefits?.map((benefit, index) => (
                            <span key={index} className="text-secondary">✓ {benefit}</span>
                          ))}
                          {solution.warnings?.map((warning, index) => (
                            <span key={index} className="text-accent">⚠ {warning}</span>
                          ))}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        solution.type === "recommended" 
                          ? "bg-secondary text-secondary-foreground"
                          : solution.type === "alternative"
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {solution.type === "recommended" ? "Recommended" : 
                         solution.type === "alternative" ? "Alternative" : "Complex"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <button 
            className="px-4 py-2 border border-input rounded-md text-sm hover:bg-muted" 
            onClick={onClose}
            data-testid="button-cancel-resolution"
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90 flex items-center space-x-2" 
            onClick={handleApplyRecommended}
            data-testid="button-apply-recommended"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Apply Recommended Solution</span>
          </button>
        </div>
      </div>
    </div>
  );
}
