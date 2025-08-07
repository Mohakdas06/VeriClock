
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type ScheduleSuggestion, suggestSchedule } from '@/ai/flows/scheduling-assistant';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SchedulingPage() {
    const [loading, setLoading] = React.useState(false);
    const [suggestion, setSuggestion] = React.useState<ScheduleSuggestion | null>(null);
    const { toast } = useToast();

    const handleGenerateSchedule = async () => {
        setLoading(true);
        setSuggestion(null);
        try {
            const result = await suggestSchedule();
            setSuggestion(result);
            toast({
                title: 'Schedule Generated',
                description: 'The AI has analyzed attendance patterns and created a new schedule.'
            });
        } catch (error) {
            console.error("Error generating schedule:", error);
            toast({
                title: 'Generation Failed',
                description: 'The AI could not generate a schedule. Please check the console for errors.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageHeader
                title="AI Scheduling Assistant"
                description="Let AI analyze your attendance data to suggest an optimized class schedule."
            />

            <div className="flex justify-center">
                <Button onClick={handleGenerateSchedule} disabled={loading} size="lg">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 animate-spin" />
                            Analyzing Data...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2" />
                            Generate Optimal Schedule
                        </>
                    )}
                </Button>
            </div>

            {suggestion && (
                 <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                           <Bot /> AI-Generated Schedule
                        </CardTitle>
                        <CardDescription>
                            Based on historical attendance data, here is the suggested optimal schedule.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert className="mb-6 bg-primary/5 border-primary/20">
                            <Sparkles className="h-4 w-4 !text-primary" />
                            <AlertTitle className="font-semibold text-primary">Analysis Summary</AlertTitle>
                            <AlertDescription>
                                {suggestion.analysis}
                            </AlertDescription>
                        </Alert>
                        
                        <div className="overflow-x-auto">
                           <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time Slot</TableHead>
                                    <TableHead>Monday</TableHead>
                                    <TableHead>Tuesday</TableHead>
                                    <TableHead>Wednesday</TableHead>
                                    <TableHead>Thursday</TableHead>
                                    <TableHead>Friday</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suggestion.schedule.map((slot) => (
                                    <TableRow key={slot.time}>
                                        <TableCell className="font-medium">{slot.time}</TableCell>
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
                                            <TableCell key={day}>
                                                {slot[day as keyof typeof slot] ? (
                                                    <Badge>{slot[day as keyof typeof slot]}</Badge>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                           </Table>
                        </div>
                    </CardContent>
                 </Card>
            )}
        </>
    );
}
