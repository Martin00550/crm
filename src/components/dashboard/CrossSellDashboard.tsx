import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CrossSellOpportunity {
  id: string;
  clientName: string;
  currentPolicy: string;
  recommendedPolicy: string;
  potentialPremium: number;
  confidence: number;
  reasoning: string;
}

interface CrossSellDashboardProps {
  opportunities: CrossSellOpportunity[];
  onGenerateOpportunities: () => void;
  isGenerating: boolean;
}

export function CrossSellDashboard({
  opportunities,
  onGenerateOpportunities,
  isGenerating
}: CrossSellDashboardProps) {
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);

  const toggleOpportunity = (id: string) => {
    setSelectedOpportunities(prev =>
      prev.includes(id)
        ? prev.filter(opId => opId !== id)
        : [...prev, id]
    );
  };

  const totalPotentialValue = opportunities
    .filter(opp => selectedOpportunities.includes(opp.id))
    .reduce((sum, opp) => sum + opp.potentialPremium, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-headline italic text-on-surface">
            Cross-Sell Opportunities
          </h2>
          <p className="text-on-surface/60 font-medium">
            AI-identified opportunities to expand client accounts
          </p>
        </div>
        <Button
          onClick={onGenerateOpportunities}
          disabled={isGenerating}
          className="bg-secondary hover:bg-secondary/90 text-white"
        >
          {isGenerating ? "Analyzing..." : "Generate Opportunities"}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-on-surface">
              {opportunities.length}
            </div>
            <p className="text-sm text-on-surface/60">Identified Opportunities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-secondary">
              ${opportunities.reduce((sum, opp) => sum + opp.potentialPremium, 0).toLocaleString()}
            </div>
            <p className="text-sm text-on-surface/60">Total Potential Premium</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-on-surface">
              ${totalPotentialValue.toLocaleString()}
            </div>
            <p className="text-sm text-on-surface/60">Selected Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Recommended Policies</span>
            {selectedOpportunities.length > 0 && (
              <Badge variant="secondary">
                {selectedOpportunities.length} selected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {opportunities.length === 0 ? (
            <div className="text-center py-8 text-on-surface/60">
              <span className="material-symbols-outlined text-4xl mb-2">lightbulb</span>
              <p>No cross-sell opportunities identified yet.</p>
              <p className="text-sm">Click "Generate Opportunities" to analyze your client portfolio.</p>
            </div>
          ) : (
            opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedOpportunities.includes(opportunity.id)
                    ? 'border-secondary bg-secondary/5'
                    : 'border-border hover:border-secondary/50'
                }`}
                onClick={() => toggleOpportunity(opportunity.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-on-surface">{opportunity.clientName}</h3>
                    <p className="text-sm text-on-surface/60">
                      Current: {opportunity.currentPolicy}
                    </p>
                    <p className="text-sm font-medium text-secondary">
                      Recommended: {opportunity.recommendedPolicy}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-secondary">
                      +${opportunity.potentialPremium.toLocaleString()}/year
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={opportunity.confidence} className="w-16 h-2" />
                      <span className="text-xs text-on-surface/60">
                        {opportunity.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-on-surface/70">{opportunity.reasoning}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {selectedOpportunities.length > 0 && (
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1">
            Export Selected ({selectedOpportunities.length})
          </Button>
          <Button className="flex-1 bg-secondary hover:bg-secondary/90">
            Create Proposals
          </Button>
        </div>
      )}
    </div>
  );
}