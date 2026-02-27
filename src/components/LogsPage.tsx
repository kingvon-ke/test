import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { LogEntry } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LogsPage = () => {
  const { id } = useParams();
  const [logs, setLogs] = useState<logentry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<htmldivelement>(null);

  useEffect(() => {
    // Fetch initial logs
    fetch(`/api/apps/${id}/logs`)
      .then(res => res.json())
      .then(setLogs)
      .catch(err => console.error("Failed to fetch logs:", err));

    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'log' && message.data.appId === id) {
          setLogs(prev => [...prev, message.data]);
        }
      } catch (e) {
        console.error("Failed to parse socket message:", e);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => socket.close();
  }, [id]);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  return (
    <div classname="flex-1 flex flex-col bg-[#1a1a1a] text-gray-300 font-mono text-sm h-screen overflow-hidden">
      <header classname="h-14 bg-[#2a2a2a] border-b border-white/5 flex items-center justify-between px-6 shrink-0">
        <div classname="flex items-center gap-4">
          <script type='text/javascript' nonce='6pDjNrZb6vX61f4Y0bR8Pg==' src='https://aistudio.google.com/RKf2KSVZlVW3gZ4WrcC7VfvIEwwR-N49MOVVm7w6XBrTo92Genv-wyJU4aBNSRDLjJbStPQv5OIEn4YP_MADAOACBIZ15cZHVqF6oO8VkTyV-y1e2aqRbZa-HRpz-Ftfl1Ys7CtxHu2vs7qvx3RUEOJrbWzMlBUa10sGUHFHOpZcs-XLlVJyGfR2l8BNGcq6t-qDuY3oUdqCOK1AT5cGNkdv9lefM8SbJaXx7KCRngQjs5wSKbeLOSPXpZcrHHm2ynBgP_qsGCvVsLPpsTm50uYlVDrMilvE4CcvlzgPEw9ecCLsMSB2K_-KrX4prC6wVLpC_-3SrMFja_fltjXNf5LyrrOA19yTH1qliZYiszOk5iQbnuAAJDGeMAVbZqZe9VJ0YjOyh2BerJrsD-xZO-69NkOCZhg0ojIVd4shxNe6ImQmCxjEXY9qAkyk3UdFIVnXognFLH8CRo791W5bVLg4x3m0FM99FLfb_VY0LlcFRA63QefH1Lu-3ElKv_Fs9ZydfaLw282g_3x7UMncVdUCdjfNe2QJTyUnbWTwer9EabH6dDc1CzWyCF57ZXW6k7FhrUn9LxGz5baRrA09YPovC4kppPkgV0CeLKs1o9Qy69J9Ug'></script><link to="{`/apps/${id}`}" classname="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            <chevronright classname="rotate-180" size="{18}"/> Back to App
          </Link>
          <div classname="h-4 w-px bg-white/10 mx-2"/>
          <span classname="text-white font-semibold flex items-center gap-2">
            <span classname="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
            Real-time Logs
          </span>
        </div>
        <div classname="flex items-center gap-6">
          <label classname="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked="{autoScroll}" onchange="{e" ==""> setAutoScroll(e.target.checked)}
              className="rounded border-white/10 bg-white/5 text-[#79589F] focus:ring-0" 
            />
            <span classname="text-xs text-gray-400">Auto-scroll</span>
          </label>
          <button onclick="{()" ==""> setLogs([])}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            Clear Logs
          </button>
        </div>
      </header>
      
      <div classname="flex-1 overflow-y-auto p-6 space-y-1 custom-scrollbar">
        {logs.length === 0 ? (
          <div classname="h-full flex items-center justify-center text-gray-600 italic">
            Waiting for logs...
          </div>
        ) : (
          logs.map((log, i) => (
            <div key="{i}" classname="flex gap-4 group hover:bg-white/5 py-0.5 px-2 -mx-2 rounded transition-colors">
              <span classname="text-gray-600 shrink-0 select-none w-20">
                {format(new Date(log.timestamp), 'HH:mm:ss')}
              </span>
              <span classname="{cn(" "shrink-0="" font-bold="" uppercase="" text-[9px]="" px-1.5="" rounded="" h-4="" flex="" items-center="" tracking-wider",="" log.source="==" 'build'="" ?="" "bg-blue-900="" 40="" text-blue-400="" border="" border-blue-400="" 20"="" :="" log.source="==" 'app'="" ?="" "bg-emerald-900="" 40="" text-emerald-400="" border="" border-emerald-400="" 20"="" :="" "bg-gray-800="" text-gray-400="" border="" border-white="" 5"="" )}="">
                {log.source}
              </span>
              <span classname="break-all leading-relaxed">{log.content}</span>
            </div>
          ))
        )}
        <div ref="{logEndRef}"/>
      </div>

      <style dangerouslysetinnerhtml="{{" __html:="" `="" .custom-scrollbar::-webkit-scrollbar="" {="" width:="" 10px;="" }="" .custom-scrollbar::-webkit-scrollbar-track="" {="" background:="" #1a1a1a;="" }="" .custom-scrollbar::-webkit-scrollbar-thumb="" {="" background:="" #333;="" border-radius:="" 5px;="" border:="" 2px="" solid="" #1a1a1a;="" }="" .custom-scrollbar::-webkit-scrollbar-thumb:hover="" {="" background:="" #444;="" }="" `}}=""/>
    </div>
  );
};
