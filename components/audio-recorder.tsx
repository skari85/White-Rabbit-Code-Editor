'use client';

import React, { useEffect, useRef, useState } from 'react';

type RecorderState = 'idle' | 'ready' | 'recording' | 'processing' | 'error';

export default function AudioRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [message, setMessage] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [mimeType, setMimeType] = useState<string>('audio/webm');

  // Choose a supported mimeType for MediaRecorder
  useEffect(() => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
    ];
    for (const c of candidates) {
      if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) {
        setMimeType(c);
        return;
      }
    }
    setMimeType('audio/webm');
  }, []);

  const enableMic = async () => {
    try {
      setMessage('Requesting microphone permission...');
      // Create/resume AudioContext inside user gesture to satisfy autoplay policies
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state !== 'running') {
        await audioCtxRef.current.resume();
      }

      // Warm up getUserMedia to avoid first-start lag
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      setState('ready');
      setMessage('Microphone ready');
    } catch (err: any) {
      console.error('Mic enable error', err);
      setState('error');
      setMessage(err?.message || 'Failed to enable microphone');
    }
  };

  const startRecording = async () => {
    try {
      setTranscript('');
      setMessage('');
      if (!mediaStreamRef.current) {
        await enableMic();
      }
      const stream = mediaStreamRef.current!;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstart = () => { setState('recording'); };
      rec.onerror = (e) => { console.error('Recorder error', e); setState('error'); setMessage('Recording error'); };
      rec.start();
    } catch (err: any) {
      console.error('Start recording error', err);
      setState('error');
      setMessage('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    const rec = mediaRecorderRef.current;
    if (!rec || rec.state !== 'recording') return;
    setState('processing');
    rec.onstop = async () => {
      try {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setMessage('Transcribing...');
        const form = new FormData();
        form.append('file', blob, `recording.${mimeType.includes('webm') ? 'webm' : 'm4a'}`);
        const res = await fetch('/api/transcribe', { method: 'POST', body: form });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Transcription failed');
        }
        const data = await res.json();
        setTranscript(data.text || '');
        setMessage('');
        setState('ready');
      } catch (err: any) {
        console.error('Transcription error', err);
        setMessage(err?.message || 'Transcription failed');
        setState('error');
      }
    };
    rec.stop();
  };

  useEffect(() => {
    return () => {
      try { mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording' && mediaRecorderRef.current.stop(); } catch {}
      try { mediaStreamRef.current && mediaStreamRef.current.getTracks().forEach(t => t.stop()); } catch {}
      try { audioCtxRef.current && audioCtxRef.current.close(); } catch {}
    };
  }, []);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-neutral-800 bg-neutral-900 p-3">
      <div className="flex items-center gap-2">
        <button
          onClick={enableMic}
          className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-100 hover:bg-neutral-700"
          disabled={state === 'recording'}
        >
          Enable Mic
        </button>
        {state !== 'recording' ? (
          <button
            onClick={startRecording}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
          >
            Stop & Transcribe
          </button>
        )}
        <span className="text-xs text-neutral-400">{state === 'recording' ? 'Recording...' : state === 'processing' ? 'Processing...' : message}</span>
      </div>
      {transcript && (
        <div className="rounded bg-neutral-800 p-2 text-xs text-neutral-100">
          {transcript}
        </div>
      )}
    </div>
  );
}


