
'use client';

import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    loadPyodide: (options: { indexURL: string }) => Promise<any>;
    pyodide_script_loaded?: boolean;
  }
}

interface UsePyodideProps {
    onOutputStream: (msg: string) => void;
    onPlotStream: (img: string) => void;
}

export const usePyodide = ({ onOutputStream, onPlotStream }: UsePyodideProps) => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  
  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    const loadPyodide = async () => {
      try {
        const pyodideInstance = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
        });
        
        // Load packages first
        await pyodideInstance.loadPackage(['numpy', 'pandas', 'matplotlib', 'scikit-learn', 'scipy']);
        
        // Now run python code that depends on the packages
        pyodideInstance.runPython(`
          import matplotlib
          import matplotlib.pyplot as plt
          import io, base64

          matplotlib.use('agg')

          _old_show = plt.show
          def new_show():
              buf = io.BytesIO()
              plt.savefig(buf, format='png')
              buf.seek(0)
              img_str = base64.b64encode(buf.read()).decode('utf-8')
              print(f"__PLOT_STREAM_START__:{img_str}:__PLOT_STREAM_END__")
              plt.clf()
              # _old_show() # Calling original show displays plot in a new window which we don't want
          plt.show = new_show
        `);

        pyodideInstance.setStdout({
            batched: (msg: string) => {
                 const plotRegex = /__PLOT_STREAM_START__:(.*?):__PLOT_STREAM_END__/s;
                 const match = msg.match(plotRegex);
                 
                 if (match && match[1]) {
                    onPlotStream(match[1]);
                 } else {
                    onOutputStream(msg);
                 }
            }
        });
        pyodideInstance.setStderr({
            batched: (msg: string) => {
                onOutputStream(msg);
            }
        });

        pyodideRef.current = pyodideInstance;
        setPyodide(pyodideInstance);
        
      } catch (error) {
        console.error('Failed to load Pyodide runtime:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (typeof window !== 'undefined' && !pyodideRef.current) {
        setIsLoading(true);
        if (window.pyodide_script_loaded) {
            loadPyodide();
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
            script.async = true;
            script.onload = () => {
                window.pyodide_script_loaded = true;
                loadPyodide();
            };
            script.onerror = () => {
                console.error('Failed to load the Pyodide script.');
                setIsLoading(false);
            }
            document.body.appendChild(script);
        }
    } else if (pyodideRef.current) {
        setIsLoading(false);
    }
  }, [onOutputStream, onPlotStream]);

  const runPython = async (code: string) => {
    if (!pyodideRef.current) return;
    setIsRunning(true);
    try {
      await pyodideRef.current.runPythonAsync(code);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        onOutputStream(`Error: ${error.message}`);
      } else {
        onOutputStream(`An unknown error occurred.`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return { pyodide, isLoading, isRunning, runPython };
};
