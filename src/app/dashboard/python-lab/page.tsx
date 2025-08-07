
'use client';

import * as React from 'react';
import Editor from 'react-simple-code-editor';
// @ts-ignore
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import { usePyodide } from '@/hooks/use-pyodide';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Maximize, Minimize, Play, Loader2, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const initialCode = `import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Create a sample DataFrame
data = {'Category': ['A', 'B', 'C', 'D'],
        'Values': [10, 20, 15, 25]}
df = pd.DataFrame(data)

# Print the DataFrame to the console
print("Sample DataFrame:")
print(df)

# Generate a simple plot
plt.figure(figsize=(6, 4))
plt.bar(df['Category'], df['Values'], color='skyblue')
plt.title('Sample Bar Chart')
plt.xlabel('Category')
plt.ylabel('Values')
plt.show()
`;

type FullscreenState = 'editor' | 'console' | 'plot' | null;

export default function PythonLabPage() {
  const { toast } = useToast();
  const [code, setCode] = React.useState(initialCode);
  const [output, setOutput] = React.useState<string[]>([]);
  const [plot, setPlot] = React.useState<string | null>(null);
  const [fullscreen, setFullscreen] = React.useState<FullscreenState>(null);

  const { pyodide, isLoading, isRunning, runPython } = usePyodide({
    onOutputStream: (msg) => {
      setOutput((prev) => [...prev, msg]);
    },
    onPlotStream: (img) => {
      setPlot(img);
    },
  });

  const handleRunCode = async () => {
    setOutput([]);
    setPlot(null);
    try {
      await runPython(code);
    } catch (error: any) {
      setOutput((prev) => [...prev, `Error: ${error.message}`]);
      toast({
        title: 'Execution Error',
        description: 'An error occurred while running the Python code.',
        variant: 'destructive',
      });
    }
  };
  
  const handleClear = () => {
      setCode('');
      setOutput([]);
      setPlot(null);
  };

  const toggleFullscreen = (panel: FullscreenState) => {
    if (fullscreen === panel) {
      setFullscreen(null);
    } else {
      setFullscreen(panel);
    }
  };

  const renderPanel = (panelType: 'editor' | 'console' | 'plot') => {
      if (fullscreen && fullscreen !== panelType) return null;

      const isFullscreen = fullscreen === panelType;

      const panelClass = cn(
        "flex flex-col border rounded-lg shadow-sm bg-card",
        isFullscreen ? "fixed inset-0 z-50 p-4" : "h-[70vh]",
        !isFullscreen && panelType === 'plot' && !plot && 'hidden'
      );

      const header = (
          <CardHeader className="flex flex-row items-center justify-between p-2 border-b flex-shrink-0">
                <CardTitle className="text-sm font-medium px-2">
                    {panelType === 'editor' && 'Code Editor'}
                    {panelType === 'console' && 'Console Output'}
                    {panelType === 'plot' && 'Plot Output'}
                </CardTitle>
                <div className="flex items-center gap-2">
                    {panelType === 'editor' && (
                        <>
                           <Button size="icon" variant="ghost" onClick={handleRunCode} disabled={isRunning || isLoading}>
                                {isRunning ? <Loader2 className="animate-spin" /> : <Play />}
                           </Button>
                           <Button size="icon" variant="ghost" onClick={handleClear} disabled={isRunning || isLoading}>
                                <Eraser />
                           </Button>
                        </>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => toggleFullscreen(panelType)}>
                        {isFullscreen ? <Minimize/> : <Maximize />}
                    </Button>
                </div>
            </CardHeader>
      );
      
      let content;
      if (panelType === 'editor') {
          content = (
             <CardContent className="p-0 flex-grow relative">
                <div className="absolute inset-0 overflow-auto">
                    <Editor
                        value={code}
                        onValueChange={setCode}
                        highlight={(code) => highlight(code, languages.python, 'python')}
                        padding={10}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 14,
                            backgroundColor: '#2d2d2d',
                            color: '#f8f8f2',
                            minHeight: '100%',
                        }}
                        className="h-full w-full"
                    />
                </div>
             </CardContent>
          )
      } else if (panelType === 'console') {
          content = (
              <CardContent className="p-0 flex-grow relative">
                 <div className="absolute inset-0 overflow-auto">
                    <pre className="p-4 text-xs font-mono whitespace-pre-wrap bg-gray-900 text-gray-200 min-h-full">
                        {output.join('\n')}
                    </pre>
                 </div>
              </CardContent>
          )
      } else if (panelType === 'plot') {
          content = (
              <CardContent className="p-4 flex items-center justify-center flex-grow bg-muted/20 overflow-auto">
                  {plot ? (
                    <img src={`data:image/png;base64,${plot}`} alt="Matplotlib plot" className="max-w-full max-h-full object-contain"/>
                  ) : (
                    <p className="text-muted-foreground">No plot generated.</p>
                  )}
              </CardContent>
          )
      }


      return (
         <div className={cn(
             "transition-all duration-300",
             isFullscreen ? "w-full" : (fullscreen ? "w-0" : "flex-1")
         )}>
            <div className={panelClass}>
                {header}
                {content}
            </div>
         </div>
      )
  }

  if (isLoading) {
    return (
        <div className="w-full h-[80vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Initializing Python Environment...</p>
            <p className="text-xs text-muted-foreground/50">This may take a moment on first load.</p>
        </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Python Lab"
        description="Write and execute Python code with popular data science libraries, all in your browser."
      />

      <div className={cn(
          "flex gap-4 w-full",
          fullscreen && "fixed inset-0 bg-background z-40 p-4"
      )}>
        {renderPanel('editor')}
        {renderPanel('console')}
        {renderPanel('plot')}
      </div>
    </>
  );
}
