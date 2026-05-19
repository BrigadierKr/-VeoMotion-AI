import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Play, Settings, Film, Sparkles, Download, Loader2, Image as ImageIcon, Languages } from 'lucide-react';
import { MediaAsset, VideoGenConfig, GenerationStatus } from '../types';
import { translations, Language } from '../locales';

export default function VideoGenerator() {
  const [lang, setLang] = useState<Language>('ua');
  const t = translations[lang];

  const [config, setConfig] = useState<VideoGenConfig>({
    prompt: '',
    image: null,
    lastFrame: null,
    referenceImages: [],
    resolution: '720p',
    aspectRatio: '16:9',
    modelType: 'fast'
  });

  const [style, setStyle] = useState<'cinematic' | 'realistic' | 'art' | 'none'>('cinematic');
  const [intensity, setIntensity] = useState<number>(5);

  const [status, setStatus] = useState<GenerationStatus>({ step: 'idle' });
  const [activeTab, setActiveTab] = useState<'prompt' | 'images' | 'settings'>('prompt');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFrameRef = useRef<HTMLInputElement>(null);
  const refImagesRef = useRef<HTMLInputElement>(null);

  const getCombinedPrompt = () => {
    let finalPrompt = config.prompt;
    if (style === 'cinematic') finalPrompt += ", cinematic style, high dynamic range, theatrical lighting, 8k mastery";
    if (style === 'realistic') finalPrompt += ", ultra-realistic, shot on 35mm lens, natural lighting, documentary style";
    if (style === 'art') finalPrompt += ", artistic conceptual style, vibrant colors, painterly textures, surreal atmosphere";
    
    if (intensity > 7) finalPrompt += ", high motion intensity, dynamic movement";
    if (intensity < 3) finalPrompt += ", slow peaceful motion, subtle shifts";
    
    return finalPrompt;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end' | 'ref') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const processFile = (file: File): Promise<MediaAsset> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            data: (reader.result as string).split(',')[1],
            mimeType: file.type,
            previewUrl: URL.createObjectURL(file)
          });
        };
        reader.readAsDataURL(file);
      });
    };

    if (type === 'start') {
      const asset = await processFile(files[0]);
      setConfig(prev => ({ ...prev, image: asset }));
    } else if (type === 'end') {
      const asset = await processFile(files[0]);
      setConfig(prev => ({ ...prev, lastFrame: asset }));
    } else if (type === 'ref') {
      const assets = await Promise.all(Array.from(files).slice(0, 3 - config.referenceImages.length).map(processFile));
      setConfig(prev => ({ ...prev, referenceImages: [...prev.referenceImages, ...assets] }));
    }
  };

  const handleError = async (response: Response) => {
    try {
      const data = await response.json();
      if (data.error === "billing_exhausted") {
        setStatus({ 
          step: 'error', 
          error: lang === 'en' 
            ? "Credits Depleted: Your AI Studio project has no remaining credits. Please top up in the Google Cloud console."
            : "Кошти вичерпано: У вашому проекті AI Studio закінчилися кредити. Будь ласка, поповніть баланс у консолі Google Cloud.",
          operationName: 'billing_link'
        });
        return true;
      }
    } catch (e) {
      // Not JSON or other error
    }
    return false;
  };

  const startGeneration = async () => {
    setStatus({ step: 'starting' });
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          prompt: getCombinedPrompt()
        }),
      });

      if (!response.ok) {
        const handled = await handleError(response);
        if (!handled) throw new Error('Failed to start generation');
        return;
      }

      const { operationName } = await response.json();
      
      setStatus({ step: 'polling', operationName });
      pollStatus(operationName);
    } catch (error: any) {
      setStatus({ step: 'error', error: error.message });
    }
  };

  const pollStatus = async (operationName: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName }),
        });

        if (!response.ok) throw new Error('Polling failed');
        const { done, response: opRes } = await response.json();

        if (done) {
          clearInterval(interval);
          setStatus({ step: 'completed', operationName, videoUrl: `/api/video-download/${encodeURIComponent(operationName)}` });
        }
      } catch (error: any) {
        clearInterval(interval);
        setStatus({ step: 'error', error: error.message });
      }
    }, 5000);
  };

  const removeImage = (type: 'start' | 'end' | 'ref', index?: number) => {
    if (type === 'start') setConfig(prev => ({ ...prev, image: null }));
    else if (type === 'end') setConfig(prev => ({ ...prev, lastFrame: null }));
    else if (type === 'ref' && index !== undefined) {
      setConfig(prev => ({
        ...prev,
        referenceImages: prev.referenceImages.filter((_, i) => i !== index)
      }));
    }
  };



  return (
    <div className="max-w-6xl mx-auto px-4 py-12 min-h-screen">
      <header className="mb-12 text-center relative">
        <div className="absolute top-0 right-0">
          <button 
            onClick={() => setLang(lang === 'en' ? 'ua' : 'en')}
            className="px-4 py-2 glass rounded-full text-[10px] uppercase font-mono text-zinc-400 hover:text-white transition-all flex items-center gap-2"
          >
            <Languages className="w-3 h-3" />
            {lang === 'en' ? 'Українська' : 'English'}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">{t.tagline}</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl font-serif italic mb-4 tracking-tight"
        >
          {t.name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-400 max-w-xl mx-auto font-sans font-light"
        >
          {t.description}
        </motion.p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass rounded-3xl p-8 cinematic-shadow">
            <div className="flex gap-4 mb-8">
              {(['prompt', 'images', 'settings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-medium uppercase tracking-wider transition-all
                    ${activeTab === tab ? 'bg-white text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  {t.tabs[tab]}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'prompt' && (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t.labels.cinematicPrompt}</label>
                  <textarea
                    value={config.prompt}
                    onChange={(e) => setConfig(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder={t.labels.promptPlaceholder}
                    className="w-full h-40 bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 ring-white/20 transition-all resize-none"
                  />
                  <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500">
                    <span className="px-2 py-1 bg-white/5 rounded-full border border-white/5 hover:border-white/20 cursor-pointer transition-colors" onClick={() => setConfig(p => ({...p, prompt: p.prompt + (lang === 'en' ? " 4k cinematic lighting" : " кінематографічне світло 4к")}))}>{lang === 'en' ? 'Slow Motion' : 'Уповільнена зйомка'}</span>
                    <span className="px-2 py-1 bg-white/5 rounded-full border border-white/5 hover:border-white/20 cursor-pointer transition-colors" onClick={() => setConfig(p => ({...p, prompt: p.prompt + (lang === 'en' ? " drone shot" : " зйомка з дрона")}))}>{lang === 'en' ? 'Drone Shot' : 'Зйомка з дрона'}</span>
                  </div>
                </motion.div>
              )}

              {activeTab === 'images' && (
                <motion.div
                  key="images"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t.labels.startFrame}</label>
                       <div 
                         onClick={() => fileInputRef.current?.click()}
                         className="aspect-square glass rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all group relative overflow-hidden"
                       >
                         {config.image ? (
                           <>
                             <img src={config.image.previewUrl} className="w-full h-full object-cover" />
                             <button onClick={(e) => { e.stopPropagation(); removeImage('start'); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-all">
                               <X className="w-3 h-3" />
                             </button>
                           </>
                         ) : (
                           <>
                             <Upload className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors mb-2" />
                             <span className="text-[10px] text-zinc-500 uppercase font-mono">{t.labels.upload}</span>
                           </>
                         )}
                       </div>
                       <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'start')} accept="image/*" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t.labels.endFrame}</label>
                       <div 
                         onClick={() => lastFrameRef.current?.click()}
                         className="aspect-square glass rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all group relative overflow-hidden"
                       >
                         {config.lastFrame ? (
                           <>
                             <img src={config.lastFrame.previewUrl} className="w-full h-full object-cover" />
                             <button onClick={(e) => { e.stopPropagation(); removeImage('end'); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-all">
                               <X className="w-3 h-3" />
                             </button>
                           </>
                         ) : (
                           <>
                             <Upload className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors mb-2" />
                             <span className="text-[10px] text-zinc-500 uppercase font-mono">{t.labels.upload}</span>
                           </>
                         )}
                       </div>
                       <input ref={lastFrameRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'end')} accept="image/*" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t.labels.referenceAssets}</label>
                      <span className="text-[10px] font-mono text-zinc-600">{config.referenceImages.length}/3</span>
                    </div>
                    <div className="flex gap-4">
                      {config.referenceImages.map((img, i) => (
                        <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative glass group">
                          <img src={img.previewUrl} className="w-full h-full object-cover" />
                          <button onClick={() => removeImage('ref', i)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {config.referenceImages.length < 3 && (
                        <button 
                          onClick={() => refImagesRef.current?.click()}
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center hover:border-white/20 hover:bg-white/5 transition-all text-zinc-600 hover:text-zinc-400"
                        >
                          <ImageIcon className="w-5 h-5 mb-1" />
                          <span className="text-[8px] uppercase font-mono">{t.labels.add}</span>
                        </button>
                      )}
                    </div>
                    <input ref={refImagesRef} type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'ref')} accept="image/*" />
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t.labels.aestheticStyle}</label>
                    <div className="grid grid-cols-3 gap-2">
                       {(['cinematic', 'realistic', 'art'] as const).map(s => (
                         <button 
                           key={s}
                           onClick={() => setStyle(s)}
                           className={`py-2 rounded-xl border transition-all text-[10px] capitalize
                             ${style === s ? 'bg-white/10 border-white/40 text-white' : 'border-white/5 text-zinc-500'}`}
                         >
                           {t.styles[s]}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t.labels.motionIntensity}</label>
                      <span className="text-[10px] font-mono text-zinc-400">{intensity}</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" 
                      value={intensity} 
                      onChange={(e) => setIntensity(parseInt(e.target.value))}
                      className="w-full accent-white h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t.labels.aspectRatio}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setConfig(prev => ({ ...prev, aspectRatio: '16:9' }))}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 
                          ${config.aspectRatio === '16:9' ? 'bg-white/10 border-white/20' : 'border-white/5 hover:bg-white/5'}`}
                      >
                        <div className="w-12 h-7 bg-zinc-700 rounded-sm" />
                        <span className="text-[10px] font-mono">16:9</span>
                      </button>
                      <button 
                        onClick={() => setConfig(prev => ({ ...prev, aspectRatio: '9:16' }))}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 
                          ${config.aspectRatio === '9:16' ? 'bg-white/10 border-white/20' : 'border-white/5 hover:bg-white/5'}`}
                      >
                        <div className="w-7 h-12 bg-zinc-700 rounded-sm" />
                        <span className="text-[10px] font-mono">9:16</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t.labels.generationSpeed}</label>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => setConfig(prev => ({ ...prev, modelType: 'fast' }))}
                        className={`flex-1 py-3 rounded-xl border transition-all text-[10px] uppercase font-mono
                          ${config.modelType === 'fast' ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'border-white/5 text-zinc-500'}`}
                      >
                        {t.labels.fast}
                      </button>
                      <button 
                        onClick={() => setConfig(prev => ({ ...prev, modelType: 'normal' }))}
                        className={`flex-1 py-3 rounded-xl border transition-all text-[10px] uppercase font-mono
                          ${config.modelType === 'normal' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'border-white/5 text-zinc-500'}`}
                      >
                        {t.labels.highQuality}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-12">
              <button
                onClick={startGeneration}
                disabled={status.step !== 'idle' && status.step !== 'completed' && status.step !== 'error'}
                className="w-full bg-white text-zinc-950 h-16 rounded-2xl font-medium tracking-tight flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {status.step === 'starting' || status.step === 'polling' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t.actions.processing}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>{t.actions.generate}</span>
                  </>
                )}
              </button>
              {status.error && (
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-red-400 text-center font-mono">Error: {status.error}</p>
                  {status.operationName === 'billing_link' && (
                    <a 
                      href="https://ai.studio/projects" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl text-[10px] uppercase font-bold hover:bg-red-500/30 transition-all"
                    >
                       <Settings className="w-3 h-3" />
                       {lang === 'en' ? 'Manage Billing in AI Studio' : 'Керувати оплатою в AI Studio'}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-7 h-full">
          <div className="glass rounded-[2rem] aspect-[16/10] overflow-hidden relative cinematic-shadow flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{t.status.masterPreview}</span>
              </div>
              <div className="flex gap-3">
                 <div className="px-2 py-0.5 rounded bg-white/5 text-zinc-600 border border-white/5 text-[9px] font-mono uppercase">720p</div>
                 <div className="px-2 py-0.5 rounded bg-white/5 text-zinc-600 border border-white/5 text-[9px] font-mono uppercase">H.264</div>
              </div>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center group">
              <AnimatePresence mode="wait">
                {status.step === 'completed' && status.videoUrl ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="w-full h-full relative"
                  >
                    <video 
                      src={status.videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-full object-contain bg-black"
                    />
                    <div className="absolute bottom-6 right-6">
                       <a 
                         href={status.videoUrl} 
                         download 
                         className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-950 rounded-full text-xs font-bold hover:scale-105 transition-transform"
                       >
                         <Download className="w-3 h-3" />
                         {t.actions.download}
                       </a>
                    </div>
                  </motion.div>
                ) : status.step === 'polling' || status.step === 'starting' ? (
                  <div className="text-center space-y-6 max-w-sm px-6">
                    <div className="relative inline-block">
                      <div className="w-20 h-20 border-2 border-white/5 rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                      </div>
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full -z-10"
                      />
                    </div>
                    <div className="space-y-2">
                       <h3 className="font-serif italic text-xl">{t.status.directing}</h3>
                       <p className="text-xs text-zinc-500 leading-relaxed">
                         {t.status.directingDesc}
                       </p>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         animate={{ x: [-200, 400] }}
                         transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                         className="w-1/3 h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                       />
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 px-12 group-hover:scale-105 transition-transform duration-700">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl mx-auto flex items-center justify-center border border-white/10">
                      <Film className="w-8 h-8 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-sm font-serif italic text-zinc-400">{t.status.awaiting}</p>
                      <p className="text-[10px] font-mono text-zinc-600 mt-2 uppercase tracking-wide">{t.status.awaitingDesc}</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="px-8 py-6 border-t border-white/5 bg-black/10">
               <div className="flex justify-between items-end">
                  <div className="space-y-4 flex-1 mr-8">
                     <div className="flex items-center gap-4">
                        <div className="px-3 py-1 glass rounded-lg text-[9px] font-mono text-zinc-400">VE.03</div>
                        <div className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Shot Sequence 01</div>
                     </div>
                     <div className="h-[1px] w-full bg-gradient-to-r from-white/20 to-transparent" />
                     <div className="flex gap-8 text-zinc-600">
                        <div className="flex flex-col">
                           <span className="text-[8px] uppercase mb-1">Exposure</span>
                           <span className="text-[10px] font-mono text-zinc-400">AUTO</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] uppercase mb-1">FPS</span>
                           <span className="text-[10px] font-mono text-zinc-400">24.00</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] uppercase mb-1">ISO</span>
                           <span className="text-[10px] font-mono text-zinc-400">400</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <div className="text-4xl font-serif italic text-white/5 select-none">VEO</div>
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-6">
             <div className="glass rounded-2xl p-4 flex items-center gap-4 border-l-2 border-l-orange-500/50">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                   <Sparkles className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                   <h4 className="text-[10px] uppercase font-bold tracking-wider">AI Upscaling</h4>
                   <p className="text-[9px] text-zinc-500 font-mono">ENABLED</p>
                </div>
             </div>
             <div className="glass rounded-2xl p-4 flex items-center gap-4 border-l-2 border-l-blue-500/50">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                   <Play className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                   <h4 className="text-[10px] uppercase font-bold tracking-wider">Sound Palette</h4>
                   <p className="text-[9px] text-zinc-500 font-mono">DYNAMIC</p>
                </div>
             </div>
             <div className="glass rounded-2xl p-4 flex items-center gap-4 border-l-2 border-l-zinc-500/50">
                <div className="w-10 h-10 rounded-full bg-zinc-500/10 flex items-center justify-center">
                   <Settings className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                   <h4 className="text-[10px] uppercase font-bold tracking-wider">Consistency</h4>
                   <p className="text-[9px] text-zinc-500 font-mono">REF-DRIVEN</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <footer className="mt-24 pt-12 border-t border-white/5 pb-12 flex flex-col md:flex-row justify-between items-center gap-8 px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white text-zinc-950 flex items-center justify-center font-bold text-xs italic">V</div>
          <span className="text-xs uppercase tracking-[0.2em] font-mono text-zinc-500">{t.name}</span>
        </div>
        <div className="flex gap-12 font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
           <a href="#" className="hover:text-white transition-colors">{t.footer.documentation}</a>
           <a href="#" className="hover:text-white transition-colors">{t.footer.apiStatus}</a>
           <a href="#" className="hover:text-white transition-colors">{t.footer.terms}</a>
        </div>
        <div className="flex items-center gap-4 px-4 py-2 rounded-full glass border border-white/5">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
           <span className="text-[9px] font-mono text-zinc-400 uppercase">{t.status.online}</span>
        </div>
      </footer>
    </div>
  );
}
