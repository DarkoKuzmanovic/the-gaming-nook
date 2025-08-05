class AudioService {
  constructor() {
    this.soundEffectsEnabled = true;
    this.musicEnabled = true;
    this.backgroundMusic = null;
    this.soundEffects = {};
    
    // Initialize audio elements
    this.initializeAudio();
  }

  initializeAudio() {
    // Background music
    this.backgroundMusic = new Audio('/vetrolisci/audio/music.mp3');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.3; // Lower volume for background music
    
    // Sound effects
    this.soundEffects.placeCards = new Audio('/vetrolisci/audio/place_cards.mp3');
    this.soundEffects.playCard = new Audio('/vetrolisci/audio/play_card.mp3');
    this.soundEffects.win = new Audio('/vetrolisci/audio/win.mp3');
    this.soundEffects.lose = new Audio('/vetrolisci/audio/lose.mp3');
    this.soundEffects.validate = new Audio('/vetrolisci/audio/validate.mp3');
    
    // Set volume for sound effects
    Object.values(this.soundEffects).forEach(audio => {
      audio.volume = 0.7;
    });
  }

  // Play sound effect
  playSound(soundName) {
    if (!this.soundEffectsEnabled) return;
    
    const sound = this.soundEffects[soundName];
    if (sound) {
      // Reset to beginning and play
      sound.currentTime = 0;
      sound.play().catch(error => {
        console.log('Could not play sound:', error);
      });
    }
  }

  // Start background music
  startBackgroundMusic() {
    if (!this.musicEnabled || !this.backgroundMusic) return;
    
    this.backgroundMusic.play().catch(error => {
      console.log('Could not play background music:', error);
    });
  }

  // Stop background music
  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  // Toggle sound effects
  toggleSoundEffects() {
    this.soundEffectsEnabled = !this.soundEffectsEnabled;
    return this.soundEffectsEnabled;
  }

  // Toggle background music
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    
    if (this.musicEnabled) {
      this.startBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
    
    return this.musicEnabled;
  }

  // Get current states
  isSoundEffectsEnabled() {
    return this.soundEffectsEnabled;
  }

  isMusicEnabled() {
    return this.musicEnabled;
  }
}

// Create singleton instance
const audioService = new AudioService();
export default audioService;