import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const incidentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  service: z.string().min(1, 'Service is required'),
  environment: z.enum(['dev', 'staging', 'production']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

interface CreateIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: IncidentFormValues) => Promise<void>;
  loading?: boolean;
}

export function CreateIncidentDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: CreateIncidentDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      title: '',
      description: '',
      service: '',
      environment: 'production',
      severity: 'CRITICAL',
    },
  });

  const environment = watch('environment');
  const severity = watch('severity');

  React.useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const handleFormSubmit = async (data: IncidentFormValues) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Create Telemetry Incident
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Incident Title</Label>
            <Input id="title" {...register('title')} className="bg-black/10 text-xs h-9" />
            {errors.title && <span className="text-[10px] text-red-400">{errors.title.message}</span>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Description Details</Label>
            <Textarea id="desc" {...register('description')} className="bg-black/10 text-xs min-h-[60px]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="service">Target Service</Label>
              <Input id="service" {...register('service')} className="bg-black/10 text-xs h-9" />
              {errors.service && <span className="text-[10px] text-red-400">{errors.service.message}</span>}
            </div>

            <div className="space-y-1.5">
              <Label>Environment</Label>
              <Select value={environment} onValueChange={(val) => setValue('environment', val as any)}>
                <SelectTrigger className="h-9 text-xs bg-black/10 border-border">
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="dev">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Severity</Label>
            <Select value={severity} onValueChange={(val) => setValue('severity', val as any)}>
              <SelectTrigger className="h-9 text-xs bg-black/10 border-border">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 bg-purple-600 hover:bg-purple-700 text-white text-xs cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Dispatch Alert'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateIncidentDialog;
