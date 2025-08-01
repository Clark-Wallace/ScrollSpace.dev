class FishTankGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Game objects
        this.fish = [];
        this.food = [];
        this.particles = [];
        this.matrixDrops = [];
        
        // Input handling
        this.mouse = { x: 0, y: 0 };
        this.lastTapTime = 0;
        this.tapDelay = 300; // Double-tap detection window
        
        // Timers
        this.predatorTimer = 0;
        this.predatorInterval = 45000 + Math.random() * 45000; // 45-90 seconds
        this.matrixTimer = 0;
        this.matrixInterval = 100; // Create matrix drops every 100ms
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createBubbleEffects();
        this.resizeCanvas();
        
        // Show instructions initially
        document.getElementById('instructions').classList.remove('hidden');
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Pause button
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        // Signal modal close button
        document.getElementById('signal-close').addEventListener('click', () => {
            document.getElementById('signal-modal').classList.remove('active');
        });
        
        // Removed test button listener
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Enhanced touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            // Handle touch as click for consistency
            this.handleClick(e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
        });
        
        // Prevent context menu on right click/long press
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Handle window resize for responsive design
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Removed test keyboard shortcut
        
        // Handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.resizeCanvas();
            }, 100);
        });
    }
    
    resizeCanvas() {
        // Full screen canvas
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Update canvas style for proper scaling
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
    }
    
    startGame() {
        document.getElementById('instructions').classList.add('hidden');
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = 0; // Reset timing
        this.deltaTime = 16.67; // Initialize with 60fps
        
        // Initialize fish population
        this.createInitialFish();
        
        // Track game start time
        this.gameStartTime = Date.now();
        this.fishEatenCount = 0;
        
        // Start game loop with proper timing
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    createInitialFish() {
        this.fish = [];
        const fishCount = 8 + Math.floor(Math.random() * 5); // 8-12 fish
        
        for (let i = 0; i < fishCount; i++) {
            this.fish.push(this.createFish());
        }
        
        this.updateFishCount();
    }
    
    createFish() {
        // Bright, vibrant colors that pop against black background
        const colors = ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#FF4500', '#FF1493', '#00BFFF', '#FFD700', '#FF69B4', '#32CD32', '#FF6347', '#9370DB'];
        
        return {
            x: Math.random() * (this.width - 100) + 50,
            y: Math.random() * (this.height - 100) + 50,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: 15 + Math.random() * 10,
            originalSize: 15 + Math.random() * 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            state: 'normal', // normal, feeding, fleeing, hungry, predator
            hungerLevel: 0,
            glowIntensity: 0,
            target: null,
            angle: Math.random() * Math.PI * 2,
            targetAngle: Math.random() * Math.PI * 2,
            swimSpeed: 0.5 + Math.random() * 1,
            maxSpeed: 2,
            fleeSpeed: 4,
            turnSpeed: 0.05,
            wanderAngle: Math.random() * Math.PI * 2,
            wanderRadius: 30,
            wanderDistance: 50,
            wanderJitter: 0.3,
            schoolingRadius: 60,
            separationRadius: 25,
            alignmentRadius: 40,
            cohesionRadius: 50,
            id: Math.random().toString(36).substr(2, 9),
            lastBounceTime: 0,
            finOffset: 0,
            bodyWave: 0
        };
    }
    
    handleClick(e) {
        const currentTime = Date.now();
        
        // Double-tap detection
        if (currentTime - this.lastTapTime < this.tapDelay) {
            this.dropFood(this.mouse.x, this.mouse.y);
        } else {
            // Single click - try to catch predator
            this.tryCapturePredator(this.mouse.x, this.mouse.y);
        }
        
        this.lastTapTime = currentTime;
    }
    
    handleTouch() {
        const currentTime = Date.now();
        
        // Double-tap detection for mobile
        if (currentTime - this.lastTapTime < this.tapDelay) {
            this.dropFood(this.mouse.x, this.mouse.y);
        } else {
            this.tryCapturePredator(this.mouse.x, this.mouse.y);
        }
        
        this.lastTapTime = currentTime;
    }
    
    dropFood(x, y) {
        // Signal facts from our void
        const signalFacts = [
            "Octopi have three hearts and blue blood",
            "Honey never spoils - archaeologists found 3000-year-old honey that's still edible",
            "The human brain uses 20% of the body's energy despite being 2% of body weight",
            "Quantum entanglement allows particles to affect each other instantly across any distance",
            "Trees can communicate through underground fungal networks called the 'Wood Wide Web'",
            "Time moves faster at your head than your feet due to gravitational time dilation",
            "There are more possible chess games than atoms in the observable universe",
            "Tardigrades can survive in space, extreme radiation, and near absolute zero",
            "Your body contains more bacterial cells than human cells",
            "A day on Venus is longer than its year"
        ];
        
        const fact = signalFacts[Math.floor(Math.random() * signalFacts.length)];
        
        this.food.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 0.3,
            vy: 0.3 + Math.random() * 0.2,
            text: fact,
            size: 6 + Math.random() * 4, // Pellet size
            opacity: 1,
            life: 3000, // Longer lifetime
            glow: 0,
            consumed: false
        });
    }
    
    // Removed - no longer needed
    
    tryCapturePredator(x, y) {
        for (let fish of this.fish) {
            if (fish.state === 'predator' || fish.state === 'hungry') {
                const distance = Math.sqrt((fish.x - x) ** 2 + (fish.y - y) ** 2);
                if (distance < fish.size * 1.5) { // Larger capture radius
                    this.captureFish(fish);
                    return true;
                }
            }
        }
        return false;
    }
    
    captureFish(fish) {
        // Remove fish and add score
        const index = this.fish.indexOf(fish);
        if (index > -1) {
            this.fish.splice(index, 1);
            
            // Calculate score based on predator size and time as predator
            const baseScore = Math.floor(fish.size * 15);
            const sizeBonus = Math.floor((fish.size - fish.originalSize) * 20);
            const totalScore = baseScore + sizeBonus;
            
            this.score += totalScore;
            this.updateScore();
            this.updateFishCount();
            
            // Create enhanced capture effect
            this.createCaptureEffect(fish.x, fish.y, fish.size);
            
            // Show AI-generated signal modal
            this.showSignalModal();
            
            // Spawn new fish to maintain population
            setTimeout(() => {
                if (this.fish.length < 6) {
                    this.fish.push(this.createFish());
                    this.updateFishCount();
                }
            }, 2000);
        }
    }
    
    createCaptureEffect(x, y, size) {
        const particleCount = Math.floor(size * 0.8);
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                size: 2 + Math.random() * 4,
                color: `hsl(${Math.random() * 60 + 15}, 100%, ${60 + Math.random() * 30}%)`,
                life: 50 + Math.random() * 30,
                maxLife: 50 + Math.random() * 30,
                type: 'capture'
            });
        }
        
        // Add sparkle effect
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * size,
                y: y + (Math.random() - 0.5) * size,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: 3 + Math.random() * 3,
                color: `hsl(45, 100%, 80%)`,
                life: 40 + Math.random() * 20,
                maxLife: 40 + Math.random() * 20,
                type: 'sparkle'
            });
        }
    }
    
    createScorePopup(x, y, score) {
        this.particles.push({
            x: x,
            y: y - 20,
            vx: 0,
            vy: -2,
            size: 16,
            color: '#FFD700',
            life: 120,
            maxLife: 120,
            type: 'score',
            text: `+${score}`,
            alpha: 1
        });
    }
    
    async showSignalModal() {
        const modal = document.getElementById('signal-modal');
        if (!modal) return;
        
        // End the game
        this.endGame();
        
        // Show final score
        const finalScoreEl = document.getElementById('final-score');
        if (finalScoreEl) finalScoreEl.textContent = this.score;
        
        // Get AI-generated signal
        await this.fetchSignalMessage();
        
        modal.classList.add('active');
        
        // Don't auto-close - game has ended
    }
    
    endGame() {
        // Stop the game
        this.isRunning = false;
        this.isPaused = true;
        
        // Stop all fish movement
        this.fish.forEach(fish => {
            fish.vx = 0;
            fish.vy = 0;
        });
        
        // Stop food movement
        this.food.forEach(food => {
            food.vx = 0;
            food.vy = 0;
        });
        
        // Calculate game stats
        this.gameEndTime = Date.now();
        this.timeElapsed = Math.floor((this.gameEndTime - this.gameStartTime) / 1000);
    }
    
    async fetchSignalMessage() {
        const signalTextEl = document.getElementById('signal-text');
        if (!signalTextEl) return;
        
        // Show loading state
        signalTextEl.textContent = 'Decoding signal...';
        signalTextEl.style.fontStyle = 'italic';
        
        try {
            // Try to fetch from local server
            const response = await fetch('http://localhost:3001/api/generate-signal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    score: this.score,
                    fishEaten: this.fishEatenCount || 0,
                    timeElapsed: this.timeElapsed || 0
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                signalTextEl.textContent = data.signal;
                signalTextEl.style.fontStyle = 'normal';
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            // Fallback to static message if server is not running
            console.log('Using fallback signal (server not running)');
            signalTextEl.textContent = 'The signal has emerged';
            signalTextEl.style.fontStyle = 'normal';
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.textContent = this.isPaused ? '▶️' : '⏸️';
        
        if (!this.isPaused) {
            // Reset timing when resuming to prevent large delta jumps
            this.lastTime = 0;
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }
    
    updateScore() {
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = this.score;
    }
    
    updateFishCount() {
        const fishCountEl = document.getElementById('fish-count');
        if (fishCountEl) fishCountEl.textContent = this.fish.length;
    }
    
    createBubbleEffects() {
        // Removed - no bubbles container in this version
    }
    
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning || this.isPaused) {
            // If paused or stopped, still schedule next frame to allow resuming
            if (this.isRunning) {
                requestAnimationFrame((time) => this.gameLoop(time));
            }
            return;
        }
        
        try {
            // Calculate delta time with fallback
            if (this.lastTime === 0) {
                this.lastTime = currentTime;
                this.deltaTime = 16.67; // ~60fps fallback
            } else {
                this.deltaTime = currentTime - this.lastTime;
                this.lastTime = currentTime;
            }
            
            // Clamp delta time to prevent large jumps
            this.deltaTime = Math.min(this.deltaTime, 33.33); // Max 30fps
            
            this.update();
            this.render();
            
        } catch (error) {
            console.error('Game loop error:', error);
            // Continue running even if there's an error
        }
        
        // Always schedule next frame
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        // Update timers
        this.predatorTimer += this.deltaTime;
        this.matrixTimer += this.deltaTime;
        
        // Check for predator transformation
        if (this.predatorTimer >= this.predatorInterval) {
            this.transformRandomFishToPredator();
            this.predatorTimer = 0;
            this.predatorInterval = 45000 + Math.random() * 45000; // 45-90 seconds
        }
        
        // Create matrix drops
        if (this.matrixTimer >= this.matrixInterval) {
            this.createMatrixDrops();
            this.matrixTimer = 0;
            this.matrixInterval = 150 + Math.random() * 100; // 150-250ms for subtle rain
        }
        
        // Update fish (will be implemented in next phase)
        this.updateFish();
        
        // Update food
        this.updateFood();
        
        // Update particles
        this.updateParticles();
        
        // Update matrix drops
        this.updateMatrixDrops();
        
        // Update feeding connections
        if (this.feedingConnections) {
            this.feedingConnections = this.feedingConnections.filter(conn => {
                conn.alpha *= 0.9;
                return conn.alpha > 0.01;
            });
        }
    }
    
    updateFish() {
        for (let fish of this.fish) {
            // Update animation properties
            fish.finOffset += 0.15;
            fish.bodyWave += 0.1;
            
            // Handle predator state progression
            this.updatePredatorState(fish);
            
            // Calculate steering forces
            let steeringForce = { x: 0, y: 0 };
            
            // Predator hunting behavior (highest priority)
            if (fish.state === 'predator') {
                const huntForce = this.calculateHuntingForce(fish);
                if (huntForce.magnitude > 0) {
                    steeringForce.x += huntForce.x * 4;
                    steeringForce.y += huntForce.y * 4;
                }
            } else {
                // Predator avoidance for normal fish
                const avoidForce = this.calculatePredatorAvoidanceForce(fish);
                if (avoidForce.magnitude > 0) {
                    fish.state = 'fleeing';
                    steeringForce.x += avoidForce.x * 3.5;
                    steeringForce.y += avoidForce.y * 3.5;
                }
                
                // Food seeking behavior (only for non-predators)
                const foodForce = this.calculateFoodSeekingForce(fish);
                if (foodForce.magnitude > 0 && fish.state !== 'fleeing') {
                    fish.state = 'feeding';
                    steeringForce.x += foodForce.x * 2;
                    steeringForce.y += foodForce.y * 2;
                } else if (fish.state === 'feeding' && foodForce.magnitude === 0) {
                    fish.state = 'normal';
                }
                
                // Cursor avoidance behavior (higher priority than feeding)
                const fleeForce = this.calculateFleeForce(fish);
                if (fleeForce.magnitude > 0) {
                    fish.state = 'fleeing';
                    steeringForce.x += fleeForce.x * 3;
                    steeringForce.y += fleeForce.y * 3;
                } else if (fish.state === 'fleeing' && avoidForce.magnitude === 0) {
                    fish.state = 'normal';
                }
                
                // Schooling behavior (only when not fleeing or actively feeding)
                if (fish.state !== 'fleeing' && fish.state !== 'feeding') {
                    const schoolingForce = this.calculateSchoolingForce(fish);
                    steeringForce.x += schoolingForce.x * 0.5;
                    steeringForce.y += schoolingForce.y * 0.5;
                }
            }
            
            // Wander behavior for natural movement
            const wanderForce = this.calculateWanderForce(fish);
            let wanderWeight = 0.3;
            if (fish.state === 'fleeing') wanderWeight = 0.1;
            if (fish.state === 'feeding') wanderWeight = 0.1;
            if (fish.state === 'predator') wanderWeight = 0.2;
            steeringForce.x += wanderForce.x * wanderWeight;
            steeringForce.y += wanderForce.y * wanderWeight;
            
            // Boundary avoidance
            const boundaryForce = this.calculateBoundaryForce(fish);
            steeringForce.x += boundaryForce.x * 2;
            steeringForce.y += boundaryForce.y * 2;
            
            // Apply steering force
            fish.vx += steeringForce.x;
            fish.vy += steeringForce.y;
            
            // Limit speed based on state
            let maxSpeed = fish.maxSpeed;
            if (fish.state === 'fleeing') {
                maxSpeed = fish.fleeSpeed;
            } else if (fish.state === 'feeding') {
                maxSpeed = fish.maxSpeed * 1.5;
            } else if (fish.state === 'predator') {
                maxSpeed = fish.maxSpeed * 2; // Predators are faster
            }
            
            const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
            if (speed > maxSpeed) {
                fish.vx = (fish.vx / speed) * maxSpeed;
                fish.vy = (fish.vy / speed) * maxSpeed;
            }
            
            // Update position
            fish.x += fish.vx;
            fish.y += fish.vy;
            
            // Update angle based on velocity
            if (fish.vx !== 0 || fish.vy !== 0) {
                fish.targetAngle = Math.atan2(fish.vy, fish.vx);
                const turnSpeed = fish.state === 'fleeing' ? fish.turnSpeed * 3 : fish.turnSpeed;
                fish.angle = this.lerpAngle(fish.angle, fish.targetAngle, turnSpeed);
            }
            
            // Check for food consumption (only non-predators)
            if (fish.state !== 'predator') {
                this.checkFoodConsumption(fish);
            }
            
            // Check for predator hunting
            if (fish.state === 'predator') {
                this.checkPredatorHunting(fish);
            }
            
            // Keep fish in bounds with soft boundaries
            fish.x = Math.max(fish.size, Math.min(this.width - fish.size, fish.x));
            fish.y = Math.max(fish.size, Math.min(this.height - fish.size, fish.y));
        }
    }
    
    updatePredatorState(fish) {
        if (fish.state === 'hungry') {
            // Gradually increase size and glow
            fish.hungerLevel += 0.5;
            const progress = Math.min(fish.hungerLevel / 100, 1);
            fish.size = fish.originalSize + (fish.originalSize * 0.8 * progress);
            fish.glowIntensity = progress;
            
            // Transform to full predator when hunger reaches 100
            if (fish.hungerLevel >= 100) {
                fish.state = 'predator';
                fish.glowIntensity = 1;
            }
        } else if (fish.state === 'predator') {
            // Maintain glow effect with pulsing
            fish.glowIntensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
        }
    }
    
    calculateHuntingForce(predator) {
        const huntRadius = 150;
        let closestPrey = null;
        let closestDistance = Infinity;
        
        // Find closest smaller fish within hunting radius
        for (let prey of this.fish) {
            if (prey === predator || prey.state === 'predator' || prey.state === 'hungry') continue;
            if (prey.size >= predator.size * 0.67) continue; // Only hunt significantly smaller fish
            
            const dx = prey.x - predator.x;
            const dy = prey.y - predator.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < huntRadius && distance < closestDistance) {
                closestPrey = prey;
                closestDistance = distance;
            }
        }
        
        if (closestPrey) {
            const dx = closestPrey.x - predator.x;
            const dy = closestPrey.y - predator.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const strength = (huntRadius - distance) / huntRadius;
                return {
                    x: (dx / distance) * strength,
                    y: (dy / distance) * strength,
                    magnitude: strength
                };
            }
        }
        
        return { x: 0, y: 0, magnitude: 0 };
    }
    
    calculatePredatorAvoidanceForce(fish) {
        const avoidRadius = 100;
        let totalForce = { x: 0, y: 0 };
        let predatorCount = 0;
        
        for (let predator of this.fish) {
            if (predator.state !== 'predator' && predator.state !== 'hungry') continue;
            if (predator === fish) continue;
            
            const dx = fish.x - predator.x;
            const dy = fish.y - predator.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < avoidRadius && distance > 0) {
                const strength = (avoidRadius - distance) / avoidRadius;
                totalForce.x += (dx / distance) * strength;
                totalForce.y += (dy / distance) * strength;
                predatorCount++;
            }
        }
        
        if (predatorCount > 0) {
            totalForce.x /= predatorCount;
            totalForce.y /= predatorCount;
            const magnitude = Math.sqrt(totalForce.x * totalForce.x + totalForce.y * totalForce.y);
            return {
                x: totalForce.x,
                y: totalForce.y,
                magnitude: magnitude
            };
        }
        
        return { x: 0, y: 0, magnitude: 0 };
    }
    
    checkPredatorHunting(predator) {
        const huntRadius = predator.size * 1.2;
        
        for (let i = this.fish.length - 1; i >= 0; i--) {
            const prey = this.fish[i];
            if (prey === predator || prey.state === 'predator' || prey.state === 'hungry') continue;
            if (prey.size >= predator.size * 0.67) continue; // Only hunt significantly smaller fish
            
            const dx = predator.x - prey.x;
            const dy = predator.y - prey.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < huntRadius) {
                // Predator catches prey
                this.fish.splice(i, 1);
                this.fishEatenCount++;
                
                // Predator grows from eating
                predator.size += prey.size * 0.3;
                predator.originalSize += prey.size * 0.3;
                
                // Create hunting effect
                this.createHuntingEffect(prey.x, prey.y);
                
                // Update fish count
                this.updateFishCount();
                
                // Spawn new fish after delay to maintain population
                setTimeout(() => {
                    if (this.fish.length < 6) {
                        this.fish.push(this.createFish());
                        this.updateFishCount();
                    }
                }, 3000);
                
                break; // Only hunt one fish per frame
            }
        }
    }
    
    createHuntingEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: 2 + Math.random() * 4,
                color: `hsl(${Math.random() * 30}, 100%, 60%)`,
                life: 40 + Math.random() * 20,
                maxLife: 40 + Math.random() * 20
            });
        }
    }
    
    calculateFoodSeekingForce(fish) {
        const seekRadius = 150; // Larger radius for signal pieces
        let closestFood = null;
        let closestDistance = Infinity;
        
        // Find closest signal piece within seeking radius
        for (let food of this.food) {
            const dx = food.x - fish.x;
            const dy = food.y - fish.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < seekRadius && distance < closestDistance && food.opacity > 0.3) {
                closestFood = food;
                closestDistance = distance;
            }
        }
        
        if (closestFood) {
            const dx = closestFood.x - fish.x;
            const dy = closestFood.y - fish.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const strength = (seekRadius - distance) / seekRadius;
                return {
                    x: (dx / distance) * strength,
                    y: (dy / distance) * strength,
                    magnitude: strength
                };
            }
        }
        
        return { x: 0, y: 0, magnitude: 0 };
    }
    
    checkFoodConsumption(fish) {
        const consumeRadius = fish.size * 1.5; // Detection radius
        
        for (let i = this.food.length - 1; i >= 0; i--) {
            const food = this.food[i];
            const dx = fish.x - food.x;
            const dy = fish.y - food.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < consumeRadius + food.size) {
                // Mark as consumed and start eating
                food.consumed = true;
                
                // Quick consumption of pellet
                food.size *= 0.9;
                food.opacity *= 0.95;
                food.glow = 1;
                
                // Fish grows
                fish.size += 0.2;
                fish.originalSize += 0.2;
                
                // Visual feedback - simple line
                if (!this.feedingConnections) this.feedingConnections = [];
                this.feedingConnections.push({
                    x1: fish.x,
                    y1: fish.y,
                    x2: food.x,
                    y2: food.y,
                    alpha: 0.8
                });
                
                // Score for eating
                this.score += 2;
                this.updateScore();
                
                // Remove if too small
                if (food.size < 0.5) {
                    this.food.splice(i, 1);
                    this.createConsumptionEffect(food.x, food.y);
                }
                
                break; // Only consume one food per frame
            }
        }
    }
    
    createConsumptionEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 1 + Math.random() * 2,
                color: `hsl(${45 + Math.random() * 30}, 100%, 70%)`,
                life: 20 + Math.random() * 10,
                maxLife: 20 + Math.random() * 10
            });
        }
    }
    
    calculateFleeForce(fish) {
        const fleeRadius = 80;
        const dx = fish.x - this.mouse.x;
        const dy = fish.y - this.mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < fleeRadius && distance > 0) {
            // Normalize and scale by proximity
            const strength = (fleeRadius - distance) / fleeRadius;
            return {
                x: (dx / distance) * strength,
                y: (dy / distance) * strength,
                magnitude: strength
            };
        }
        
        return { x: 0, y: 0, magnitude: 0 };
    }
    
    calculateSchoolingForce(fish) {
        let separation = { x: 0, y: 0 };
        let alignment = { x: 0, y: 0 };
        let cohesion = { x: 0, y: 0 };
        
        let separationCount = 0;
        let alignmentCount = 0;
        let cohesionCount = 0;
        
        for (let other of this.fish) {
            if (other === fish || other.state === 'predator') continue;
            
            const dx = fish.x - other.x;
            const dy = fish.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Separation - avoid crowding neighbors
            if (distance < fish.separationRadius && distance > 0) {
                separation.x += dx / distance;
                separation.y += dy / distance;
                separationCount++;
            }
            
            // Alignment - steer towards average heading of neighbors
            if (distance < fish.alignmentRadius) {
                alignment.x += other.vx;
                alignment.y += other.vy;
                alignmentCount++;
            }
            
            // Cohesion - steer towards average position of neighbors
            if (distance < fish.cohesionRadius) {
                cohesion.x += other.x;
                cohesion.y += other.y;
                cohesionCount++;
            }
        }
        
        let totalForce = { x: 0, y: 0 };
        
        // Apply separation
        if (separationCount > 0) {
            separation.x /= separationCount;
            separation.y /= separationCount;
            totalForce.x += separation.x * 1.5;
            totalForce.y += separation.y * 1.5;
        }
        
        // Apply alignment
        if (alignmentCount > 0) {
            alignment.x /= alignmentCount;
            alignment.y /= alignmentCount;
            totalForce.x += (alignment.x - fish.vx) * 0.3;
            totalForce.y += (alignment.y - fish.vy) * 0.3;
        }
        
        // Apply cohesion
        if (cohesionCount > 0) {
            cohesion.x /= cohesionCount;
            cohesion.y /= cohesionCount;
            totalForce.x += (cohesion.x - fish.x) * 0.01;
            totalForce.y += (cohesion.y - fish.y) * 0.01;
        }
        
        return totalForce;
    }
    
    calculateWanderForce(fish) {
        // Wander steering behavior for natural fish movement
        fish.wanderAngle += (Math.random() - 0.5) * fish.wanderJitter;
        
        // Calculate the wander target
        const wanderTarget = {
            x: fish.wanderRadius * Math.cos(fish.wanderAngle),
            y: fish.wanderRadius * Math.sin(fish.wanderAngle)
        };
        
        // Project the wander circle in front of the fish
        const circleCenter = {
            x: fish.x + fish.wanderDistance * Math.cos(fish.angle),
            y: fish.y + fish.wanderDistance * Math.sin(fish.angle)
        };
        
        const target = {
            x: circleCenter.x + wanderTarget.x,
            y: circleCenter.y + wanderTarget.y
        };
        
        // Calculate steering force toward target
        const desired = {
            x: target.x - fish.x,
            y: target.y - fish.y
        };
        
        const distance = Math.sqrt(desired.x * desired.x + desired.y * desired.y);
        if (distance > 0) {
            desired.x = (desired.x / distance) * fish.swimSpeed;
            desired.y = (desired.y / distance) * fish.swimSpeed;
        }
        
        return {
            x: desired.x - fish.vx,
            y: desired.y - fish.vy
        };
    }
    
    calculateBoundaryForce(fish) {
        const margin = 50;
        let force = { x: 0, y: 0 };
        
        // Left boundary
        if (fish.x < margin) {
            force.x += (margin - fish.x) / margin;
        }
        // Right boundary
        if (fish.x > this.width - margin) {
            force.x -= (fish.x - (this.width - margin)) / margin;
        }
        // Top boundary
        if (fish.y < margin) {
            force.y += (margin - fish.y) / margin;
        }
        // Bottom boundary
        if (fish.y > this.height - margin) {
            force.y -= (fish.y - (this.height - margin)) / margin;
        }
        
        return force;
    }
    
    lerpAngle(current, target, factor) {
        // Smooth angle interpolation handling wrap-around
        let diff = target - current;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        return current + diff * factor;
    }
    
    updateFood() {
        for (let i = this.food.length - 1; i >= 0; i--) {
            const food = this.food[i];
            
            food.x += food.vx;
            food.y += food.vy;
            food.life--;
            
            // Animate glow
            if (food.glow > 0) {
                food.glow *= 0.95;
            }
            
            // Fade out when old
            if (food.life < 500) {
                food.opacity = food.life / 500;
            }
            
            // Remove expired food
            if (food.life <= 0 || food.y > this.height + 50) {
                this.food.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    transformRandomFishToPredator() {
        const normalFish = this.fish.filter(f => f.state === 'normal');
        if (normalFish.length > 0) {
            const fish = normalFish[Math.floor(Math.random() * normalFish.length)];
            fish.state = 'hungry';
            fish.hungerLevel = 0;
        }
    }
    
    render() {
        // Clear canvas with black void background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Render matrix drops (background layer)
        this.renderMatrixDrops();
        
        // Render food
        this.renderFood();
        
        // Render fish
        this.renderFish();
        
        // Render feeding connections
        this.renderFeedingConnections();
        
        // Render particles (foreground layer)
        this.renderParticles();
    }
    
    renderFood() {
        for (let food of this.food) {
            if (food.opacity < 0.01) continue; // Skip invisible food
            
            this.ctx.save();
            
            const alpha = food.opacity;
            
            // Glow effect
            if (food.glow > 0 || !food.consumed) {
                const glowSize = food.size * 3;
                const gradient = this.ctx.createRadialGradient(food.x, food.y, 0, food.x, food.y, glowSize);
                gradient.addColorStop(0, `rgba(34, 197, 94, ${alpha * 0.3})`);
                gradient.addColorStop(1, 'transparent');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(food.x, food.y, glowSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Signal pellet - glowing green orb
            const gradient = this.ctx.createRadialGradient(food.x, food.y, 0, food.x, food.y, food.size);
            gradient.addColorStop(0, `rgba(100, 255, 100, ${alpha})`);
            gradient.addColorStop(0.7, `rgba(34, 197, 94, ${alpha})`);
            gradient.addColorStop(1, `rgba(0, 150, 50, ${alpha})`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(food.x, food.y, food.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Bright core
            this.ctx.fillStyle = `rgba(200, 255, 200, ${alpha * 0.8})`;
            this.ctx.beginPath();
            this.ctx.arc(food.x, food.y, food.size * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Show text above pellet when fresh
            if (!food.consumed && food.life > 2500) {
                this.ctx.font = '10px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = `rgba(34, 197, 94, ${alpha * 0.7})`;
                
                // Truncate long text
                const displayText = food.text.length > 40 ? food.text.substring(0, 40) + '...' : food.text;
                this.ctx.fillText(displayText, food.x, food.y - food.size - 10);
            }
            
            this.ctx.restore();
        }
    }
    
    renderFish() {
        for (let fish of this.fish) {
            this.ctx.save();
            this.ctx.translate(fish.x, fish.y);
            this.ctx.rotate(fish.angle);
            
            // Body wave animation
            const waveOffset = Math.sin(fish.bodyWave) * 0.1;
            
            // Fish body (ellipse with wave) - bright colors for visibility
            this.ctx.fillStyle = fish.color;
            this.ctx.beginPath();
            this.ctx.ellipse(0, waveOffset, fish.size, fish.size * 0.6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add a bright outline for visibility against black background
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            
            // Fish tail with animation
            const tailWave = Math.sin(fish.finOffset) * 0.3;
            this.ctx.fillStyle = fish.color;
            this.ctx.beginPath();
            this.ctx.moveTo(-fish.size * 0.8, waveOffset);
            this.ctx.lineTo(-fish.size * 1.2, -fish.size * 0.4 + tailWave);
            this.ctx.lineTo(-fish.size * 1.4, waveOffset);
            this.ctx.lineTo(-fish.size * 1.2, fish.size * 0.4 + tailWave);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            // Dorsal fin
            this.ctx.beginPath();
            this.ctx.moveTo(fish.size * 0.2, -fish.size * 0.6 + waveOffset);
            this.ctx.lineTo(fish.size * 0.1, -fish.size * 0.9 + Math.sin(fish.finOffset * 0.8) * 0.2);
            this.ctx.lineTo(-fish.size * 0.1, -fish.size * 0.6 + waveOffset);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            // Pectoral fins
            const finWave = Math.sin(fish.finOffset * 1.2) * 0.2;
            this.ctx.beginPath();
            this.ctx.moveTo(fish.size * 0.3, fish.size * 0.2);
            this.ctx.lineTo(fish.size * 0.6 + finWave, fish.size * 0.5);
            this.ctx.lineTo(fish.size * 0.2, fish.size * 0.4);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(fish.size * 0.3, -fish.size * 0.2);
            this.ctx.lineTo(fish.size * 0.6 + finWave, -fish.size * 0.5);
            this.ctx.lineTo(fish.size * 0.2, -fish.size * 0.4);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            // Fish eye - bright white for visibility
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(fish.size * 0.3, -fish.size * 0.15 + waveOffset, fish.size * 0.12, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(fish.size * 0.35, -fish.size * 0.15 + waveOffset, fish.size * 0.06, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Eye highlight
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(fish.size * 0.37, -fish.size * 0.18 + waveOffset, fish.size * 0.02, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Extra glow for predators (hungry Signal Kip)
            if (fish.glowIntensity > 0) {
                this.ctx.strokeStyle = '#FF4500';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.ellipse(0, waveOffset, fish.size + 4, fish.size * 0.6 + 3, 0, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
    }
    
    renderFeedingConnections() {
        if (!this.feedingConnections) return;
        
        this.ctx.save();
        for (let conn of this.feedingConnections) {
            this.ctx.strokeStyle = `rgba(100, 255, 100, ${conn.alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(conn.x1, conn.y1);
            this.ctx.lineTo(conn.x2, conn.y2);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }
    
    renderParticles() {
        for (let particle of this.particles) {
            this.ctx.save();
            
            if (particle.type === 'score') {
                // Render text popups
                const alpha = particle.life / particle.maxLife;
                
                if (particle.type === 'signal') {
                    // Render signal message with glow
                    this.ctx.font = `bold ${particle.size}px monospace`;
                    this.ctx.textAlign = 'center';
                    
                    // Glow effect
                    this.ctx.shadowColor = particle.color;
                    this.ctx.shadowBlur = 20;
                    this.ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
                    this.ctx.fillText(particle.text, particle.x, particle.y);
                    
                    // Second pass for brightness
                    this.ctx.shadowBlur = 0;
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
                    this.ctx.fillText(particle.text, particle.x, particle.y);
                } else {
                    // Regular score popup
                    this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
                    this.ctx.font = 'bold 16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(particle.text, particle.x, particle.y);
                    
                    // Add outline for better visibility
                    this.ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeText(particle.text, particle.x, particle.y);
                }
            } else {
                // Render regular particles
                const alpha = particle.life / particle.maxLife;
                let color = particle.color;
                
                if (color.includes('hsl')) {
                    color = color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
                } else if (color.includes('rgb')) {
                    color = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
                } else {
                    // Handle hex colors
                    this.ctx.globalAlpha = alpha;
                }
                
                this.ctx.fillStyle = color;
                
                if (particle.type === 'sparkle') {
                    // Render sparkle particles with star shape
                    this.drawStar(particle.x, particle.y, particle.size, 5);
                } else {
                    // Render regular circular particles
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                this.ctx.globalAlpha = 1;
            }
            
            this.ctx.restore();
        }
    }
    
    drawStar(x, y, radius, points) {
        const angle = Math.PI / points;
        this.ctx.beginPath();
        this.ctx.translate(x, y);
        this.ctx.moveTo(0, -radius);
        
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? radius : radius * 0.5;
            const a = angle * i;
            this.ctx.lineTo(Math.sin(a) * r, -Math.cos(a) * r);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.translate(-x, -y);
    }
    
    createMatrixDrops() {
        const dropCount = 1 + Math.random() * 2; // 1-2 drops for subtle rain
        for (let i = 0; i < dropCount; i++) {
            this.matrixDrops.push({
                x: Math.random() * this.width,
                y: -20,
                speed: 0.5 + Math.random() * 1,
                length: 12 + Math.random() * 15,
                chars: this.generateMatrixChars(6 + Math.random() * 8),
                alpha: 0.2 + Math.random() * 0.25, // More subtle alpha
                charIndex: 0,
                charTimer: 0,
                charInterval: 180 + Math.random() * 120
            });
        }
    }
    
    generateMatrixChars(count) {
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        let result = '';
        for (let i = 0; i < count; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }
    
    updateMatrixDrops() {
        for (let i = this.matrixDrops.length - 1; i >= 0; i--) {
            const drop = this.matrixDrops[i];
            
            // Update position
            drop.y += drop.speed;
            
            // Update character cycling
            drop.charTimer += this.deltaTime;
            if (drop.charTimer >= drop.charInterval) {
                drop.charIndex = (drop.charIndex + 1) % drop.chars.length;
                drop.charTimer = 0;
            }
            
            // Remove if off screen
            if (drop.y > this.height + drop.length * 15) {
                this.matrixDrops.splice(i, 1);
            }
        }
    }
    
    renderMatrixDrops() {
        this.ctx.save();
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'center';
        
        for (let drop of this.matrixDrops) {
            for (let j = 0; j < drop.chars.length; j++) {
                const charY = drop.y + (j * 16);
                if (charY > -16 && charY < this.height + 16) {
                    const alpha = drop.alpha * (1 - (j / drop.chars.length) * 0.7);
                    
                    // Subtle matrix rain with reduced brightness
                    this.ctx.fillStyle = `rgba(0, 255, 80, ${alpha * 0.6})`;
                    
                    // Slightly brighter leading character
                    if (j === 0) {
                        this.ctx.fillStyle = `rgba(200, 255, 200, ${Math.min(alpha * 1.2, 0.8)})`;
                    }
                    // Second character with subtle green
                    else if (j === 1) {
                        this.ctx.fillStyle = `rgba(80, 255, 80, ${Math.min(alpha * 0.9, 0.6)})`;
                    }
                    
                    this.ctx.fillText(drop.chars[j], drop.x, charY);
                }
            }
        }
        
        this.ctx.restore();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    window.game = new FishTankGame();
});

