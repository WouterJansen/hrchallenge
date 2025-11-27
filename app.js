// Heart Rate Monitor Connection and Audio Unlock App
class HeartRateApp {
    constructor() {
        this.device = null;
        this.server = null;
        this.heartRateService = null;
        this.heartRateCharacteristic = null;
        this.currentHeartRate = 0;
        this.isInZone = false;
        this.checkInterval = null;
        this.audioContext = null;
        this.audioBuffer = null;
        this.audioSource = null;
        this.isPlaying = false;
        
        // Audio effects nodes
        this.gainNode = null;
        this.lowPassFilter = null;
        this.highPassFilter = null;
        this.distortion = null;
        this.analyser = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeAudio();
    }
    
    initializeElements() {
        this.elements = {
            connectBtn: document.getElementById('connectBtn'),
            connectionStatus: document.getElementById('connectionStatus'),
            hrNumber: document.getElementById('hrNumber'),
            minHR: document.getElementById('minHR'),
            maxHR: document.getElementById('maxHR'),
            zoneStatus: document.getElementById('zoneStatus'),
            progressFill: document.getElementById('progressFill'),
            timeInZoneDisplay: document.getElementById('timeInZone'),
            audioSection: document.getElementById('audioSection'),
            playBtn: document.getElementById('playBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            audioUpload: document.getElementById('audioUpload')
        };
    }
    
    attachEventListeners() {
        this.elements.connectBtn.addEventListener('click', () => this.connectToDevice());
        this.elements.playBtn.addEventListener('click', () => this.playAudio());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseAudio());
        this.elements.audioUpload.addEventListener('change', (e) => this.handleAudioUpload(e));
    }
    
    async initializeAudio() {
        // Initialize Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create audio effect nodes
        this.gainNode = this.audioContext.createGain();
        this.lowPassFilter = this.audioContext.createBiquadFilter();
        this.highPassFilter = this.audioContext.createBiquadFilter();
        this.analyser = this.audioContext.createAnalyser();
        
        // Configure filters
        this.lowPassFilter.type = 'lowpass';
        this.highPassFilter.type = 'highpass';
        
        // Create distortion
        this.distortion = this.audioContext.createWaveShaper();
        this.distortion.curve = this.makeDistortionCurve(0);
        
        // Connect the audio graph: source -> distortion -> filters -> gain -> analyser -> destination
        this.lowPassFilter.connect(this.gainNode);
        this.highPassFilter.connect(this.lowPassFilter);
        this.distortion.connect(this.highPassFilter);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        // Create a simple beep as default audio message
        await this.createDefaultAudio();
    }
    
    makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }
    
    async createDefaultAudio() {
        // Create a simple synthesized secret message (beeps that spell out a message in morse code)
        // Or you can load a default audio file
        const sampleRate = this.audioContext.sampleRate;
        const duration = 3; // seconds
        const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
        
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            
            // Create a simple melody as the "secret message"
            const frequencies = [440, 494, 523, 587, 659, 698, 784]; // A major scale
            const noteLength = sampleRate * 0.3;
            
            for (let i = 0; i < channelData.length; i++) {
                const noteIndex = Math.floor(i / noteLength) % frequencies.length;
                const freq = frequencies[noteIndex];
                const t = i / sampleRate;
                
                // Generate a sine wave with envelope
                const envelope = Math.exp(-3 * (i % noteLength) / noteLength);
                channelData[i] = envelope * Math.sin(2 * Math.PI * freq * t) * 0.3;
            }
        }
        
        this.audioBuffer = buffer;
    }
    
    async handleAudioUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            alert('Audio file loaded successfully! This is your new secret message.');
        } catch (error) {
            console.error('Error loading audio file:', error);
            alert('Error loading audio file. Please try a different file.');
        }
    }
    
    async connectToDevice() {
        try {
            console.log('Requesting Bluetooth Device...');
            
            // Request a Bluetooth device with Heart Rate service
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }],
                optionalServices: ['battery_service']
            });
            
            console.log('Connecting to GATT Server...');
            this.server = await this.device.gatt.connect();
            
            console.log('Getting Heart Rate Service...');
            this.heartRateService = await this.server.getPrimaryService('heart_rate');
            
            console.log('Getting Heart Rate Measurement Characteristic...');
            this.heartRateCharacteristic = await this.heartRateService.getCharacteristic('heart_rate_measurement');
            
            // Start notifications
            await this.heartRateCharacteristic.startNotifications();
            
            console.log('Notifications started');
            this.heartRateCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
                this.handleHeartRateChange(event);
            });
            
            // Handle disconnection
            this.device.addEventListener('gattserverdisconnected', () => {
                this.handleDisconnection();
            });
            
            this.updateConnectionStatus(true);
            this.startZoneCheck();
            
        } catch (error) {
            console.error('Connection error:', error);
            alert('Failed to connect to device. Make sure your heart rate monitor is nearby and try again.');
        }
    }
    
    handleHeartRateChange(event) {
        const value = event.target.value;
        const heartRate = this.parseHeartRate(value);
        this.currentHeartRate = heartRate;
        this.updateHeartRateDisplay(heartRate);
    }
    
    parseHeartRate(value) {
        // Heart Rate Measurement characteristic format
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        let heartRate;
        
        if (rate16Bits) {
            heartRate = value.getUint16(1, true);
        } else {
            heartRate = value.getUint8(1);
        }
        
        return heartRate;
    }
    
    updateHeartRateDisplay(heartRate) {
        this.elements.hrNumber.textContent = heartRate;
        
        // Add animation
        this.elements.hrNumber.style.animation = 'none';
        setTimeout(() => {
            this.elements.hrNumber.style.animation = 'pulse 0.5s ease';
        }, 10);
    }
    
    updateConnectionStatus(connected) {
        const statusDot = this.elements.connectionStatus.querySelector('.status-dot');
        const statusText = this.elements.connectionStatus.querySelector('span:last-child');
        
        if (connected) {
            statusDot.classList.remove('disconnected');
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
            this.elements.connectBtn.textContent = '✓ Connected';
            this.elements.connectBtn.disabled = true;
        } else {
            statusDot.classList.remove('connected');
            statusDot.classList.add('disconnected');
            statusText.textContent = 'Not Connected';
            this.elements.connectBtn.textContent = '🔗 Connect Heart Rate Monitor';
            this.elements.connectBtn.disabled = false;
        }
    }
    
    handleDisconnection() {
        console.log('Device disconnected');
        this.updateConnectionStatus(false);
        this.stopZoneCheck();
        this.resetProgress();
    }
    
    startZoneCheck() {
        this.checkInterval = setInterval(() => {
            this.checkHeartRateZone();
        }, 100); // Check every 100ms
    }
    
    stopZoneCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    
    checkHeartRateZone() {
        const minHR = parseInt(this.elements.minHR.value);
        const maxHR = parseInt(this.elements.maxHR.value);
        const targetHR = (minHR + maxHR) / 2;
        const inZone = this.currentHeartRate >= minHR && this.currentHeartRate <= maxHR;
        
        // Calculate how far we are from the target zone (0 = in zone, 1 = very far)
        let distance;
        if (inZone) {
            distance = 0;
        } else if (this.currentHeartRate < minHR) {
            distance = Math.min((minHR - this.currentHeartRate) / minHR, 1);
        } else {
            distance = Math.min((this.currentHeartRate - maxHR) / maxHR, 1);
        }
        
        // Update audio effects based on distance
        this.updateAudioEffects(distance);
        
        // Update UI
        if (inZone) {
            if (!this.isInZone) {
                this.isInZone = true;
                this.elements.zoneStatus.textContent = 'In Target Zone! ✓ Message Clear!';
                this.elements.zoneStatus.classList.add('in-zone');
            }
        } else {
            if (this.isInZone) {
                this.isInZone = false;
                this.elements.zoneStatus.textContent = 'Outside Zone - Message Scrambled';
                this.elements.zoneStatus.classList.remove('in-zone');
            }
        }
        
        // Update progress bar to show clarity level
        const clarity = (1 - distance) * 100;
        this.elements.progressFill.style.width = clarity + '%';
        this.elements.timeInZoneDisplay.textContent = clarity.toFixed(0) + '%';
    }
    
    updateAudioEffects(distance) {
        if (!this.isPlaying) return;
        
        // distance: 0 = in zone (clear), 1 = far away (maximum scramble)
        
        // Low pass filter: clear = 20000Hz, scrambled = 300Hz
        const lowPassFreq = 20000 - (distance * 19700);
        this.lowPassFilter.frequency.setTargetAtTime(lowPassFreq, this.audioContext.currentTime, 0.1);
        
        // High pass filter: clear = 20Hz, scrambled = 800Hz
        const highPassFreq = 20 + (distance * 780);
        this.highPassFilter.frequency.setTargetAtTime(highPassFreq, this.audioContext.currentTime, 0.1);
        
        // Distortion: more distortion when further away
        this.distortion.curve = this.makeDistortionCurve(distance * 400);
        
        // Volume: quieter when scrambled
        const volume = 0.3 + (1 - distance) * 0.7;
        this.gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
    }
    

    
    async playAudio() {
        if (!this.audioBuffer) {
            alert('No audio loaded yet!');
            return;
        }
        
        // Stop any currently playing audio
        if (this.audioSource) {
            this.audioSource.stop();
        }
        
        // Resume audio context if suspended (required for autoplay policies)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        // Create a new source
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;
        this.audioSource.loop = true; // Loop the audio
        
        // Connect through the effects chain
        this.audioSource.connect(this.distortion);
        
        // Handle playback end
        this.audioSource.onended = () => {
            this.isPlaying = false;
            this.elements.playBtn.style.display = 'inline-block';
            this.elements.pauseBtn.style.display = 'none';
        };
        
        this.audioSource.start(0);
        this.isPlaying = true;
        this.elements.playBtn.style.display = 'none';
        this.elements.pauseBtn.style.display = 'inline-block';
        
        // Initialize effects to maximum scramble
        this.updateAudioEffects(1);
    }
    
    pauseAudio() {
        if (this.audioSource && this.isPlaying) {
            this.audioSource.stop();
            this.isPlaying = false;
            this.elements.playBtn.style.display = 'inline-block';
            this.elements.pauseBtn.style.display = 'none';
        }
    }
}

// Add celebration animation
const style = document.createElement('style');
style.textContent = `
    @keyframes celebrate {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
`;
document.head.appendChild(style);

// Initialize the app when the page loads
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new HeartRateApp();
    });
} else {
    app = new HeartRateApp();
}

// Check for Web Bluetooth API support
if (!navigator.bluetooth) {
    alert('Web Bluetooth API is not available in this browser. Please use Chrome, Edge, or Opera on a desktop or Android device.');
}
