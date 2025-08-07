
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, File, FolderKanban, Globe, Gem, BrainCircuit, LineChart } from 'lucide-react';
import Link from 'next/link';

const simulations = [
  {
    title: "Wave Interference Simulation",
    url: "https://phet.colorado.edu/en/simulation/wave-interference"
  },
  {
    title: "Gravity and Orbits",
    url: "https://phet.colorado.edu/en/simulation/gravity-and-orbits"
  },
  {
    title: "Build an Atom",
    url: "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html"
  },
  {
    title: "Quantum Tunneling and Wave Packets",
    url: "https://phet.colorado.edu/en/simulation/quantum-tunneling"
  },
  {
      title: "The Greenhouse Effect",
      url: "https://phet.colorado.edu/en/simulation/greenhouse"
  }
];

export default function ResourcesPage() {
  return (
    <>
      <PageHeader
        title="Resources"
        description="Access important files, notes, and useful links."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column */}
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download /> Simulation File (Downloadable)
                    </CardTitle>
                    <CardDescription>
                        A curated list of astronomy and physics simulations collected from academic sources.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <a href="/All Physics Simulations.pdf" download>
                        <Button className="w-full">
                            <File className="mr-2" /> Download Physics Simulation PDF
                        </Button>
                    </a>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FolderKanban /> Shared Google Drive Folder
                    </CardTitle>
                    <CardDescription>
                        Access all shared notes, documents, and study resources.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <a href="https://drive.google.com/drive/folders/14fgt_UBZR3VWby88TfEWDgGwpH1-wH6w?usp=drive_link" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full">
                           <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.205 7.209L13.845 7.203L14.395 6.103C14.895 5.003 14.195 4 12.895 4H5.39497C4.19497 4 3.19497 4.9 3.19497 6.1V17.9C3.19497 19.1 4.19497 20 5.39497 20H18.595C19.795 20 20.795 19.1 20.795 17.9V8.303C20.805 7.703 20.505 7.309 20.205 7.209Z" fill="#FFC107"></path><path d="M8.06506 12.359L12.3551 4.86903C12.4851 4.60903 12.8951 4.60903 13.0251 4.86903L17.3151 12.359L21.1651 12.362L14.9951 1.63903C14.7951 1.25903 14.2451 1.09903 13.8451 1.29903L7.20506 4.31903C6.75506 4.51903 6.50506 5.00903 6.70506 5.46903L8.06506 12.359Z" fill="#2196F3"></path><path d="M8.06494 12.361L6.70494 5.47101C6.50494 5.01101 5.95494 4.85101 5.55494 5.05101L2.83494 6.31101C2.38494 6.51101 2.13494 7.00101 2.33494 7.46101L8.06494 19.351C8.26494 19.811 8.81494 19.971 9.21494 19.771L12.1849 18.351C12.6349 18.151 12.8849 17.661 12.6849 17.201L8.06494 12.361Z" fill="#4CAF50"></path></svg>
                           Open Notes & Attachments
                        </Button>
                    </a>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gem /> Hidden Gems
                    </CardTitle>
                    <CardDescription>
                       Powerful tools that are less known but extremely useful for learning.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="rounded-lg border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="space-y-1">
                                <h3 className="font-semibold flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /> Wolfram Alpha</h3>
                                <p className="text-xs text-muted-foreground pl-7">A computational knowledge engine for solving complex math and physics problems.</p>
                            </div>
                            <a href="https://www.wolframalpha.com/" target="_blank" rel="noopener noreferrer">
                                <Button variant="secondary" size="sm">Visit</Button>
                            </a>
                        </div>
                         <div className="rounded-lg border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="space-y-1">
                                <h3 className="font-semibold flex items-center gap-2"><LineChart className="h-5 w-5 text-primary" /> Desmos Graphing Calculator</h3>
                                <p className="text-xs text-muted-foreground pl-7">A powerful online graphing calculator ideal for plotting mathematical functions.</p>
                            </div>
                            <a href="https://www.desmos.com/calculator" target="_blank" rel="noopener noreferrer">
                                <Button variant="secondary" size="sm">Visit</Button>
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe /> Curated Physics Simulations
                    </CardTitle>
                    <CardDescription>
                        Interactive simulations for gravity, quantum physics, astronomy, optics, etc.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {simulations.map(sim => (
                            <div key={sim.title} className="rounded-lg border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                <div className="space-y-1">
                                    <h3 className="font-semibold">{sim.title}</h3>
                                    <p className="text-xs text-muted-foreground">{new URL(sim.url).hostname}</p>
                                </div>
                                <a href={sim.url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="secondary" size="sm">Explore</Button>
                                </a>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
