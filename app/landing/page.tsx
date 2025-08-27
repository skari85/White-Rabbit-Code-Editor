'use client';

import { Button } from '@/components/ui/button';
import { Code2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
  const mainScreenRef = useRef<HTMLDivElement>(null);
  const developerBackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mainScreenRef.current || !developerBackRef.current) return;

    const mainScreen = mainScreenRef.current;
    const developerBack = developerBackRef.current;
    
    let rabbits: Array<{
      element: HTMLElement;
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      speed: number;
      moving: boolean;
    }> = [];
    let codeSnippets: Array<{
      element: HTMLElement;
      originalText: string;
      x: number;
      y: number;
      speed: number;
    }> = [];
    let animationFrameId: number;
    
    const numRabbits = 5;
    const numCodeSnippets = 50;
    
    const snippets = [
      'const rabbit = new Rabbit();', 'if (hasRabbitEars) { return "🐇"; }',
      'let isHappy = true;', '=> console.log("Hoppy coding!");',
      '// TODO: add more carrots', '{ "ears": "fluffy", "tail": "white" }',
      'console.error("Syntax Error: missing carrot");',
      'const developer = { ears: true, fluffy: true };',
      'function hop() { return "🐰"; }',
      '// Rabbit-powered development',
      'if (rabbit.isHappy) { productivity++; }'
    ];

    // Core Animation Loop
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      updateRabbits();
      updateCodeSnippets();
    }

    // Object Creation
    function createRabbit() {
      const rabbitEl = document.createElement('div');
      rabbitEl.className = 'absolute text-4xl cursor-pointer transition-transform duration-200 hover:scale-110';
      rabbitEl.textContent = '🐇';
      rabbitEl.style.zIndex = '20';
      mainScreen.appendChild(rabbitEl);
      
      rabbitEl.addEventListener('click', handleRabbitClick);

      return {
        element: rabbitEl,
        x: Math.random() * (mainScreen.clientWidth - 50),
        y: Math.random() * (mainScreen.clientHeight - 50),
        targetX: Math.random() * (mainScreen.clientWidth - 50),
        targetY: Math.random() * (mainScreen.clientHeight - 50),
        speed: 0.5 + Math.random(),
        moving: false
      };
    }

    function createCodeSnippet() {
      const codeEl = document.createElement('div');
      codeEl.className = 'absolute text-lg font-mono opacity-0 outline-none cursor-text';
      codeEl.contentEditable = 'true';
      
      const originalText = snippets[Math.floor(Math.random() * snippets.length)];
      codeEl.textContent = originalText;
      
      const colors = ['text-green-400', 'text-cyan-400', 'text-purple-400'];
      codeEl.classList.add(colors[Math.floor(Math.random() * colors.length)]);

      mainScreen.appendChild(codeEl);
      
      return {
        element: codeEl,
        originalText: originalText,
        x: Math.random() * mainScreen.clientWidth,
        y: -Math.random() * mainScreen.clientHeight,
        speed: 1 + Math.random() * 2
      };
    }

    // Update Functions
    function updateRabbits() {
      rabbits.forEach(rabbit => {
        if (Math.abs(rabbit.x - rabbit.targetX) < rabbit.speed && Math.abs(rabbit.y - rabbit.targetY) < rabbit.speed) {
          rabbit.targetX = Math.random() * (mainScreen.clientWidth - 50);
          rabbit.targetY = Math.random() * (mainScreen.clientHeight - 50);
          rabbit.moving = true;
        }
        
        const dx = rabbit.targetX - rabbit.x;
        const dy = rabbit.targetY - rabbit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          rabbit.x += (dx / distance) * rabbit.speed;
          rabbit.y += (dy / distance) * rabbit.speed;
        }

        rabbit.element.style.left = `${rabbit.x}px`;
        rabbit.element.style.top = `${rabbit.y}px`;
      });
    }

    function updateCodeSnippets() {
      codeSnippets.forEach(code => {
        code.y += code.speed;
        code.element.style.top = `${code.y}px`;
        code.element.style.opacity = `${Math.max(0.1, 1 - (code.y / mainScreen.clientHeight))}`;

        if (code.y > mainScreen.clientHeight) {
          code.y = -Math.random() * 200;
          code.x = Math.random() * mainScreen.clientWidth;
          code.element.style.left = `${code.x}px`;
          code.element.textContent = code.originalText;
        }
      });
    }
    
    // Interaction Handlers
    function handleRabbitClick(event: Event) {
      const rabbitEl = event.currentTarget as HTMLElement;
      const emojis = ['🐇', '🐰', '🥕', '🕳️'];
      rabbitEl.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      rabbitEl.classList.add('animate-bounce');
      setTimeout(() => {
        rabbitEl.classList.remove('animate-bounce');
      }, 200);
    }
    
    function handleDeveloperClick() {
      developerBack.classList.add('animate-pulse');
      
      // Make eyes blink
      const eyes = developerBack.querySelectorAll('div[style*="4a90e2"]');
      eyes.forEach(eye => {
        (eye as HTMLElement).style.opacity = '0.3';
        setTimeout(() => {
          (eye as HTMLElement).style.opacity = '1';
        }, 150);
      });
      
      // Add typing effect to screen
      addTypingEffect();
      
      setTimeout(() => {
        developerBack.classList.remove('animate-pulse');
      }, 200);
    }

    // Add typing effect
    function addTypingEffect() {
      const typingTexts = [
        'console.log("🐰 Rabbit Dev Mode Activated...");',
        'const carrot = { color: "orange", tasty: true };',
        '// Coding with fluffy rabbit ears 🐇',
        'if (rabbit.isHappy) { productivity++; }',
        'function hop() { return "Bouncing to success!"; }'
      ];
      const typingText = typingTexts[Math.floor(Math.random() * typingTexts.length)];
      const typingEl = document.createElement('div');
      typingEl.className = 'absolute text-green-400 font-mono text-lg z-20';
      typingEl.style.left = '50px';
      typingEl.style.top = '100px';
      typingEl.style.textShadow = '0 0 10px rgba(34, 197, 94, 0.5)';
      mainScreen.appendChild(typingEl);

      let i = 0;
      const typeWriter = () => {
        if (i < typingText.length) {
          typingEl.textContent = typingText.substring(0, i + 1);
          i++;
          setTimeout(typeWriter, 80);
        } else {
          // Remove after 3 seconds
          setTimeout(() => {
            typingEl.remove();
          }, 3000);
        }
      };
      typeWriter();
    }

    // Make eyes blink randomly
    function blinkEyes() {
      const eyes = developerBack.querySelectorAll('div[style*="4a90e2"]');
      eyes.forEach(eye => {
        (eye as HTMLElement).style.opacity = '0.3';
        setTimeout(() => {
          (eye as HTMLElement).style.opacity = '1';
        }, 150);
      });
    }

    // Random blinking
    setInterval(blinkEyes, 3000 + Math.random() * 2000);

    // Environmental Dynamics
    const screenColors = [
      { bg: '#000a12', shadow: '0 0 50px rgba(0, 255, 255, 0.5), 0 0 100px rgba(0, 255, 255, 0.2)' },
      { bg: '#100c25', shadow: '0 0 50px rgba(255, 0, 255, 0.5), 0 0 100px rgba(255, 0, 255, 0.2)' },
      { bg: '#231215', shadow: '0 0 50px rgba(255, 200, 0, 0.5), 0 0 100px rgba(255, 200, 0, 0.2)' }
    ];
    let currentColorIndex = 0;

    function changeScreenTheme() {
      currentColorIndex = (currentColorIndex + 1) % screenColors.length;
      const theme = screenColors[currentColorIndex];
      mainScreen.style.backgroundColor = theme.bg;
      mainScreen.style.boxShadow = theme.shadow;
    }

    // Initialization
    function init() {
      rabbits.forEach(rabbit => {
        rabbit.element.removeEventListener('click', handleRabbitClick);
        rabbit.element.remove();
      });
      codeSnippets.forEach(code => {
        code.element.remove();
      });
      rabbits = [];
      codeSnippets = [];
      
      for (let i = 0; i < numRabbits; i++) {
        rabbits.push(createRabbit());
      }
      
      for (let i = 0; i < numCodeSnippets; i++) {
        codeSnippets.push(createCodeSnippet());
      }
      
      developerBack.addEventListener('click', handleDeveloperClick);
      
      setInterval(changeScreenTheme, 5000);

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animate();
    }

    init();

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      developerBack.removeEventListener('click', handleDeveloperClick);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <div className="flex items-center">
          <Code2 className="w-6 h-6 text-white mr-2" />
          <span className="text-white font-semibold">WHITE RABBIT</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/visual-tools" className="text-gray-300 hover:text-white transition-colors">
            Visual Tools
          </Link>
          <Link href="/enter">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
              Enter White Rabbit
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-100px)] px-6">
        {/* Left Side - Content */}
        <div className="lg:w-1/2 max-w-2xl mb-12 lg:mb-0">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Build faster with a focused, AI‑powered code space
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            A minimal, fast web code editor with AI, visual tools, and a polished UX. 
            Click below to explore the full editor, or try the mini coding space.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href="/enter">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg">
                Enter White Rabbit
              </Button>
            </Link>
            <Link href="/visual-tools">
              <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg">
                Explore Visual Tools
              </Button>
            </Link>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            <div className="flex items-center text-gray-300">
              <span className="text-purple-400 mr-3">*</span>
              AI-assisted coding streamed into Monaco
            </div>
            <div className="flex items-center text-gray-300">
              <span className="text-purple-400 mr-3">*</span>
              Visual Tools hub (Git History, Code Flow, Smart File Tree)
            </div>
            <div className="flex items-center text-gray-300">
              <span className="text-purple-400 mr-3">*</span>
              Breathing caret + Focus Field ripple line highlight
            </div>
            <div className="flex items-center text-gray-300">
              <span className="text-purple-400 mr-3">*</span>
              Unified progress bar for long tasks
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Rabbits</h2>
          </div>
        </div>

        {/* Right Side - Mini Coding Space */}
        <div className="lg:w-1/2 max-w-2xl">
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-700 px-4 py-2 flex justify-between items-center">
              <span className="text-white font-medium">JAVASCRIPT</span>
              <span className="text-gray-400 text-sm">Lines: 6</span>
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-300 font-mono">
                <div className="text-gray-500">1 // Mini coding space (demo)</div>
                <div className="text-blue-400">2 function</div>
                <div className="text-yellow-400">greet</div>
                <div className="text-gray-300">(name) {'{'}</div>
                <div className="text-blue-400">3   return</div>
                <div className="text-green-400">`Welcome to White Rabbit, Developer!`</div>
                <div className="text-gray-300">;</div>
                <div className="text-gray-300">4 {'}'}</div>
                <div className="text-gray-300">5</div>
                <div className="text-blue-400">6 console</div>
                <div className="text-gray-300">.</div>
                <div className="text-yellow-400">log</div>
                <div className="text-gray-300">(greet(</div>
                <div className="text-green-400">&apos;Developer&apos;</div>
                <div className="text-gray-300">));</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <span className="text-gray-400 text-sm">Mini coding space (demo)</span>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Developer Screen Animation Section */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
              Interactive Rabbit Developer Experience
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Meet our cute rabbit developer coding away! Click on the rabbit and code snippets to see the magic happen!
            </p>
          </div>
          
          <div className="relative w-full h-[600px] bg-black rounded-2xl overflow-hidden">
            {/* Rabbit Developer Character - Back View */}
            <div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[280px] h-[350px] z-10 cursor-pointer transition-transform duration-200 ease-in-out hover:scale-105"
              id="developerBack"
              ref={developerBackRef}
            >
              {/* Rabbit Body - Back View */}
              <div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[200px] h-[280px] z-[9]"
                style={{
                  background: 'radial-gradient(ellipse at center, #f5f5f5 0%, #e8e8e8 30%, #dcdcdc 60%, #d0d0d0 100%)',
                  borderRadius: '50% 50% 30% 30%',
                  boxShadow: '0 0 20px rgba(0, 0, 0, 0.2), inset 0 0 30px rgba(255, 255, 255, 0.3)',
                  border: '2px solid #e0e0e0'
                }}
              >
                {/* Fur texture */}
                <div
                  className="absolute top-5 left-1/2 transform -translate-x-1/2 w-[180px] h-[250px]"
                  style={{
                    background: 'repeating-linear-gradient(45deg, transparent 0px, rgba(255, 255, 255, 0.1) 1px, transparent 2px)',
                    borderRadius: '50% 50% 30% 30%'
                  }}
                ></div>
              </div>

              {/* Rabbit Head - Back View */}
              <div
                className="absolute top-[50px] left-1/2 transform -translate-x-1/2 w-[160px] h-[180px] z-[10]"
                style={{
                  background: 'radial-gradient(ellipse at center, #f8f8f8 0%, #f0f0f0 30%, #e8e8e8 60%, #e0e0e0 100%)',
                  borderRadius: '50%',
                  boxShadow: '0 0 15px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.3)',
                  border: '2px solid #e8e8e8'
                }}
              >
                {/* Head fur texture */}
                <div
                  className="absolute top-2 left-1/2 transform -translate-x-1/2 w-[140px] h-[160px]"
                  style={{
                    background: 'repeating-linear-gradient(30deg, transparent 0px, rgba(255, 255, 255, 0.1) 1px, transparent 2px)',
                    borderRadius: '50%'
                  }}
                ></div>
              </div>

              {/* Rabbit Ears - Back View */}
              <div
                className="absolute top-[10px] left-1/2 transform -translate-x-1/2 translate-x-[-30px] w-[60px] h-[120px] z-[11]"
                style={{
                  background: 'radial-gradient(ellipse at center, #ffffff 0%, #f8f8f8 30%, #f0f0f0 60%, #e8e8e8 100%)',
                  borderRadius: '50% 50% 0 0',
                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.6)',
                  border: '2px solid #f0f0f0',
                  transform: 'rotate(-10deg)'
                }}
              >
                {/* Inner ear */}
                <div
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[30px] h-[60px]"
                  style={{
                    background: 'radial-gradient(ellipse at center, #ffb3ba 0%, #ff9aa2 50%, #ff8a95 100%)',
                    borderRadius: '50% 50% 0 0'
                  }}
                ></div>
              </div>
              <div
                className="absolute top-[10px] left-1/2 transform -translate-x-1/2 translate-x-[30px] w-[60px] h-[120px] z-[11]"
                style={{
                  background: 'radial-gradient(ellipse at center, #ffffff 0%, #f8f8f8 30%, #f0f0f0 60%, #e8e8e8 100%)',
                  borderRadius: '50% 50% 0 0',
                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.6)',
                  border: '2px solid #f0f0f0',
                  transform: 'rotate(10deg)'
                }}
              >
                {/* Inner ear */}
                <div
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[30px] h-[60px]"
                  style={{
                    background: 'radial-gradient(ellipse at center, #ffb3ba 0%, #ff9aa2 50%, #ff8a95 100%)',
                    borderRadius: '50% 50% 0 0'
                  }}
                ></div>
              </div>



              {/* Rabbit Arms - Simple */}
              <div
                className="absolute top-[180px] left-[30px] w-[50px] h-[80px] z-[8]"
                style={{
                  background: 'radial-gradient(ellipse at center, #f5f5f5 0%, #e8e8e8 50%, #dcdcdc 100%)',
                  borderRadius: '25px',
                  boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e0e0e0',
                  transform: 'rotate(-15deg)'
                }}
              ></div>

              <div
                className="absolute top-[180px] right-[30px] w-[50px] h-[80px] z-[8]"
                style={{
                  background: 'radial-gradient(ellipse at center, #f5f5f5 0%, #e8e8e8 50%, #dcdcdc 100%)',
                  borderRadius: '25px',
                  boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e0e0e0',
                  transform: 'rotate(15deg)'
                }}
              ></div>

              {/* Rabbit Tail */}
              <div
                className="absolute bottom-[50px] left-1/2 transform -translate-x-1/2 w-[40px] h-[40px] z-[12]"
                style={{
                  background: 'radial-gradient(circle, #ffffff 0%, #f8f8f8 30%, #f0f0f0 60%, #e8e8e8 100%)',
                  borderRadius: '50%',
                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.6)',
                  border: '2px solid #f0f0f0'
                }}
              >
                {/* Tail fur texture */}
                <div
                  className="absolute top-1 left-1 w-[30px] h-[30px]"
                  style={{
                    background: 'repeating-radial-gradient(circle, transparent 0px, rgba(255, 255, 255, 0.2) 2px, transparent 4px)',
                    borderRadius: '50%'
                  }}
                ></div>
              </div>
            </div>

            {/* Main Screen */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[1200px] h-[70%] z-[5] transition-all duration-[2000ms] ease-in-out"
              style={{
                backgroundColor: '#000a12',
                borderRadius: '20px',
                border: '5px solid #00ffff',
                boxShadow: '0 0 50px rgba(0, 255, 255, 0.5), 0 0 100px rgba(0, 255, 255, 0.2)'
              }}
              id="mainScreen"
              ref={mainScreenRef}
            >
              {/* Rabbits and code snippets will be added here via JavaScript */}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-auto py-8">
        <div className="text-center text-gray-400">
          <p>&copy; 2025 White Rabbit. All rights reserved.</p>
          <div className="mt-4 space-x-4 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


