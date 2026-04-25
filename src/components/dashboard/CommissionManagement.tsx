import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Commission {
  id: string;
  policyNumber: string;
  clientName: string;
  carrier: string;
  premium: number;
  commissionRate: number;
  commissionAmount: number;
  agentSplit: number;
  agentCommission: number;
  status: 'pending' | 'paid' | 'failed';
  paidAt?: Date;
}

interface CommissionManagementProps {
  commissions: Commission[];
  onUpdateCommission: (id: string, updates: Partial<Commission>) => void;
  onBulkUpdate: (ids: string[], updates: Partial<Commission>) => void;
  isUpdating: boolean;
}

export function CommissionManagement({
  commissions,
  onUpdateCommission,
  onBulkUpdate,
  isUpdating
}: CommissionManagementProps) {
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCommissions = commissions.filter(commission => {
    const matchesStatus = filterStatus === 'all' || commission.status === filterStatus;
    const matchesSearch = commission.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         commission.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         commission.carrier.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const toggleCommission = (id: string) => {
    setSelectedCommissions(prev =>
      prev.includes(id)
        ? prev.filter(commId => commId !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedCommissions.length === filteredCommissions.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(filteredCommissions.map(c => c.id));
    }
  };

  const bulkUpdateStatus = (status: Commission['status']) => {
    if (selectedCommissions.length > 0) {
      onBulkUpdate(selectedCommissions, { status });
      setSelectedCommissions([]);
    }
  };

  const totalCommissionValue = commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
  const pendingCommissionValue = commissions
    .filter(comm => comm.status === 'pending')
    .reduce((sum, comm) => sum + comm.commissionAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-headline italic text-on-surface">
            Commission Management
          </h2>
          <p className="text-on-surface/60 font-medium">
            Track and manage agent commissions across your book of business
          </p>
        </div>
        <Button className="bg-secondary hover:bg-secondary/90 text-white">
          Export Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-on-surface">
              ${totalCommissionValue.toLocaleString()}
            </div>
            <p className="text-sm text-on-surface/60">Total Commission Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              ${pendingCommissionValue.toLocaleString()}
            </div>
            <p className="text-sm text-on-surface/60">Pending Payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {commissions.filter(c => c.status === 'paid').length}
            </div>
            <p className="text-sm text-on-surface/60">Paid Commissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search by policy, client, or carrier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCommissions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-on-surface/70">
                {selectedCommissions.length} commission{selectedCommissions.length > 1 ? 's' : ''} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkUpdateStatus('paid')}
                disabled={isUpdating}
              >
                Mark as Paid
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkUpdateStatus('pending')}
                disabled={isUpdating}
              >
                Mark as Pending
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Commission Ledger</span>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedCommissions.length === filteredCommissions.length ? 'Deselect All' : 'Select All'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedCommissions.length === filteredCommissions.length && filteredCommissions.length > 0}
                    onChange={selectAll}
                  />
                </TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead className="text-right">Premium</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedCommissions.includes(commission.id)}
                      onChange={() => toggleCommission(commission.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{commission.policyNumber}</TableCell>
                  <TableCell>{commission.clientName}</TableCell>
                  <TableCell>{commission.carrier}</TableCell>
                  <TableCell className="text-right">${commission.premium.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{commission.commissionRate}%</TableCell>
                  <TableCell className="text-right font-bold">${commission.commissionAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        commission.status === 'paid' ? 'default' :
                        commission.status === 'pending' ? 'secondary' : 'destructive'
                      }
                    >
                      {commission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={commission.status}
                      onValueChange={(value: Commission['status']) =>
                        onUpdateCommission(commission.id, { status: value })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}