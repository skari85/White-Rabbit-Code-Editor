'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Lightbulb,
  CheckCircle,
  X,
  Settings,
  Filter,
  RefreshCw,
  Zap,
  Shield,
  Eye,
  Code,
  Gauge,
  Trash2
} from 'lucide-react';
import { CodeInspection, InspectionCategory } from '@/lib/code-inspection-service';
import { toast } from 'sonner';

interface CodeInspectionPanelProps {
  inspections: CodeInspection[];
  isLoading: boolean;
  onInspectionClick: (inspection: CodeInspection) => void;
  onQuickFix: (inspection: CodeInspection) => void;
  onRefresh: () => void;
  onClose: () => void;
  className?: string;
}

const CodeInspectionPanel: React.FC<CodeInspectionPanelProps> = ({
  inspections,
  isLoading,
  onInspectionClick,
  onQuickFix,
  onRefresh,
  onClose,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState<Set<InspectionCategory>>(new Set());
  const [showOnlyFixable, setShowOnlyFixable] = useState(false);

  // Group inspections by type and category
  const groupedInspections = useMemo(() => {
    const filtered = inspections.filter(inspection => {
      if (selectedCategories.size > 0 && !selectedCategories.has(inspection.category)) {
        return false;
      }
      if (showOnlyFixable && !inspection.quickFix) {
        return false;
      }
      return true;
    });

    return {
      all: filtered,
      errors: filtered.filter(i => i.type === 'error'),
      warnings: filtered.filter(i => i.type === 'warning'),
      info: filtered.filter(i => i.type === 'info'),
      hints: filtered.filter(i => i.type === 'hint')
    };
  }, [inspections, selectedCategories, showOnlyFixable]);

  // Get inspection counts
  const counts = useMemo(() => ({
    errors: groupedInspections.errors.length,
    warnings: groupedInspections.warnings.length,
    info: groupedInspections.info.length,
    hints: groupedInspections.hints.length,
    total: groupedInspections.all.length
  }), [groupedInspections]);

  // Get icon for inspection type
  const getInspectionIcon = (type: string, severity: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'hint':
        return <Lightbulb className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: InspectionCategory) => {
    switch (category) {
      case 'security':
        return <Shield className="w-3 h-3" />;
      case 'performance':
        return <Gauge className="w-3 h-3" />;
      case 'accessibility':
        return <Eye className="w-3 h-3" />;
      case 'code-style':
        return <Code className="w-3 h-3" />;
      case 'unused-code':
        return <Trash2 className="w-3 h-3" />;
      default:
        return <Code className="w-3 h-3" />;
    }
  };

  // Handle category filter toggle
  const toggleCategory = useCallback((category: InspectionCategory) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Handle quick fix
  const handleQuickFix = useCallback(async (inspection: CodeInspection) => {
    try {
      await onQuickFix(inspection);
      toast.success(`Applied fix: ${inspection.quickFix?.title}`);
    } catch (error) {
      toast.error('Failed to apply quick fix');
    }
  }, [onQuickFix]);

  // Get unique categories from inspections
  const availableCategories = useMemo(() => {
    const categories = new Set<InspectionCategory>();
    inspections.forEach(inspection => categories.add(inspection.category));
    return Array.from(categories);
  }, [inspections]);

  // Render inspection item
  const renderInspection = (inspection: CodeInspection) => (
    <div
      key={inspection.id}
      className="flex items-start gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onInspectionClick(inspection)}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getInspectionIcon(inspection.type, inspection.severity)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {inspection.message}
          </span>
          <Badge variant="outline" className="text-xs">
            Line {inspection.range.startLineNumber}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {getCategoryIcon(inspection.category)}
            <span>{inspection.category}</span>
          </div>
        </div>
        
        {inspection.description && (
          <p className="text-xs text-gray-600 mb-2">
            {inspection.description}
          </p>
        )}
        
        {inspection.quickFix && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickFix(inspection);
            }}
            className="text-xs h-6 px-2"
          >
            <Zap className="w-3 h-3 mr-1" />
            {inspection.quickFix.title}
          </Button>
        )}
      </div>
      
      <div className="flex-shrink-0">
        <Badge 
          variant={inspection.severity === 'critical' ? 'destructive' : 'secondary'}
          className="text-xs"
        >
          {inspection.severity}
        </Badge>
      </div>
    </div>
  );

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Code Inspections</CardTitle>
            {counts.total > 0 && (
              <Badge variant="secondary">
                {counts.total}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh inspections"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Close inspection panel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Analyzing code...</p>
            </div>
          </div>
        ) : counts.total === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Issues Found
                </h3>
                <p className="text-sm text-gray-600">
                  Your code looks great! No inspections to report.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Filters */}
            <div className="p-3 border-b bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Filters:</span>
                <Button
                  variant={showOnlyFixable ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOnlyFixable(!showOnlyFixable)}
                  className="text-xs h-6 px-2"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Fixable Only
                </Button>
              </div>
              
              {availableCategories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {availableCategories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategories.has(category) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCategory(category)}
                      className="text-xs h-6 px-2"
                    >
                      {getCategoryIcon(category)}
                      <span className="ml-1 capitalize">{category.replace('-', ' ')}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Inspection Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-5 mx-3 mt-3">
                <TabsTrigger value="all" className="text-xs">
                  All ({counts.total})
                </TabsTrigger>
                <TabsTrigger value="errors" className="text-xs">
                  Errors ({counts.errors})
                </TabsTrigger>
                <TabsTrigger value="warnings" className="text-xs">
                  Warnings ({counts.warnings})
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs">
                  Info ({counts.info})
                </TabsTrigger>
                <TabsTrigger value="hints" className="text-xs">
                  Hints ({counts.hints})
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto">
                <TabsContent value="all" className="mt-0">
                  <div>
                    {groupedInspections.all.map(renderInspection)}
                  </div>
                </TabsContent>
                
                <TabsContent value="errors" className="mt-0">
                  <div>
                    {groupedInspections.errors.map(renderInspection)}
                  </div>
                </TabsContent>
                
                <TabsContent value="warnings" className="mt-0">
                  <div>
                    {groupedInspections.warnings.map(renderInspection)}
                  </div>
                </TabsContent>
                
                <TabsContent value="info" className="mt-0">
                  <div>
                    {groupedInspections.info.map(renderInspection)}
                  </div>
                </TabsContent>
                
                <TabsContent value="hints" className="mt-0">
                  <div>
                    {groupedInspections.hints.map(renderInspection)}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CodeInspectionPanel;
