
'use server';

/**
 * @fileOverview An AI-powered scheduling assistant that suggests optimal class schedules
 * based on student attendance patterns.
 * 
 * - suggestSchedule - A function that analyzes attendance data and returns a schedule.
 * - ScheduleSuggestion - The output type for the suggestSchedule function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AttendanceLog, Device } from '@/lib/types';
import { format } from 'date-fns';


// Define the output schema for a single schedule slot
const ScheduleSlotSchema = z.object({
    time: z.string().describe("The time slot for the class (e.g., '09:00 AM - 10:00 AM')."),
    monday: z.string().optional().describe("Class/Department scheduled for Monday in this slot."),
    tuesday: z.string().optional().describe("Class/Department scheduled for Tuesday in this slot."),
    wednesday: z.string().optional().describe("Class/Department scheduled for Wednesday in this slot."),
    thursday: z.string().optional().describe("Class/Department scheduled for Thursday in this slot."),
    friday: z.string().optional().describe("Class/Department scheduled for Friday in this slot."),
});

// Define the output schema for the entire suggestion
const ScheduleSuggestionSchema = z.object({
  analysis: z.string().describe("A brief summary of the analysis and reasoning behind the suggested schedule."),
  schedule: z.array(ScheduleSlotSchema).describe("The suggested weekly class schedule."),
});
export type ScheduleSuggestion = z.infer<typeof ScheduleSuggestionSchema>;


// The main function that will be called from the frontend
export async function suggestSchedule(): Promise<ScheduleSuggestion> {
  return suggestScheduleFlow();
}

// Define the Genkit prompt
const schedulingPrompt = ai.definePrompt({
    name: 'schedulingPrompt',
    output: { schema: ScheduleSuggestionSchema },
    prompt: `
        You are an expert AI assistant specializing in academic scheduling for a university.
        Your task is to analyze summarized student attendance data and propose an optimal weekly class schedule.
        
        The goal is to maximize student attendance by scheduling classes for different departments at times when students
        from those departments are historically most present.

        Here is the summarized attendance data, showing attendance counts per department for each day of the week and each hour of the day:
        {{{attendanceData}}}

        Please perform the following steps:
        1. Analyze the provided summarized data to identify peak attendance times for each department.
        2. Note any patterns, such as which days have the highest attendance or if attendance drops off at certain times for specific departments.
        3. Based on your analysis, create a 5-day (Monday to Friday) weekly schedule with hourly time slots from 9 AM to 5 PM.
        4. Assign departments to time slots where they have the highest attendance. Avoid scheduling conflicts.
        5. Provide a brief text summary of your analysis, explaining the reasoning for your schedule proposal.
        6. Return the analysis and the schedule in the specified JSON format.
    `,
});

// Define the Genkit flow
const suggestScheduleFlow = ai.defineFlow(
  {
    name: 'suggestScheduleFlow',
    outputSchema: ScheduleSuggestionSchema,
  },
  async () => {
    // 1. Fetch all devices to map deviceId to department
    const deviceSnapshot = await getDocs(collection(db, 'devices'));
    const deviceMap = new Map<string, string>();
    deviceSnapshot.docs.forEach(doc => {
      const device = doc.data() as Omit<Device, 'id'>;
      deviceMap.set(doc.id, device.department);
    });

    // 2. Fetch all attendance data from Firestore
    const attendanceSnapshot = await getDocs(collection(db, 'attendance_logs'));
    const attendanceLogs = attendanceSnapshot.docs.map(doc => {
        const data = doc.data();
        const department = deviceMap.get(data.deviceId) || 'Unknown';
        return { 
            ...data, 
            timestamp: data.timestamp?.toDate() || new Date(),
            department,
        } as AttendanceLog;
    });

    if (attendanceLogs.length === 0) {
        return {
            analysis: "There is no attendance data available to analyze. Please check back after some attendance has been logged.",
            schedule: []
        };
    }
    
    // 3. Process data to create a summary
    const summary: Record<string, Record<string, Record<string, number>>> = {}; // Day -> Hour -> Department -> Count

    attendanceLogs.forEach(log => {
      const day = format(log.timestamp, 'EEEE'); // Monday, Tuesday...
      const hour = format(log.timestamp, 'HH'); // 00-23
      const department = log.department;

      if (!summary[day]) summary[day] = {};
      if (!summary[day][hour]) summary[day][hour] = {};
      if (!summary[day][hour][department]) summary[day][hour][department] = 0;
      
      summary[day][hour][department]++;
    });

    const attendanceDataString = JSON.stringify(summary, null, 2);

    // 4. Call the AI model with the summarized data
    const { output } = await schedulingPrompt({ attendanceData: attendanceDataString });
    
    if (!output) {
      throw new Error('The AI model did not return a valid schedule.');
    }
    
    return output;
  }
);
