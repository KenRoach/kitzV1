# ElevenLabs Voice AI SOP v1

**Owner:** CTO Agent
**Type:** technical

## Summary
Kitz uses ElevenLabs for voice AI (TTS). This SOP captures model selection, Spanish best practices, and integration patterns.

## Model Selection

| Model | Latency | Best For | Languages |
|-------|---------|----------|-----------|
| Multilingual v2 | Medium | Voiceovers, audiobooks, emotional content | 29 languages |
| Flash v2.5 | ~75ms | Real-time agents, conversational AI | 32 languages |
| Turbo v2.5 | Low | Fast TTS with good quality | 32 languages |

### Kitz Default
- Model: `eleven_multilingual_v2` (configured)
- Voice: Rachel (configured)
- Primary language: Spanish

## Spanish Best Practices

### Language Detection
- Multilingual v2 auto-detects language from text
- Can mix languages in a single call (useful for Spanglish)
- For WhatsApp voice notes: always send as OGG Opus

### Text Formatting
- Use proper punctuation to guide rhythm
- Ellipses (...) add natural pauses
- Capitalization signals emphasis
- Spell out numbers in Spanish: "quinientos" not "500"
- Spell out acronyms: "DGI" → "de-ge-i"

### Text Normalization
- Have LLM normalize text BEFORE passing to TTS
- Critical for phone numbers, addresses, currencies
- Multilingual v2 handles number normalization better than other models

### Voice Selection
- Use language-specific voices from Voice Library for best pronunciation
- Visit language top picks for Spanish-optimized voices
- Test with actual Spanish content, not English

## WhatsApp Voice Note Integration
```
Input text → ElevenLabs TTS → MP3
MP3 → ffmpeg → OGG Opus (required for WhatsApp)
ffmpeg -i input.mp3 -c:a libopus -b:a 64k -ac 1 -ar 48000 output.ogg
mime_type: audio/ogg; codecs=opus
```

## AI Battery Cost
- 1 credit ≈ 500 ElevenLabs characters
- Voice responses should be concise (save credits)
- ROI check: is voice response worth the credit spend?

## Rules
- Always OGG Opus for WhatsApp voice notes (never MP3)
- Spanish first — use Spanish-optimized voices
- Normalize text before TTS (numbers, acronyms, currencies)
- Keep voice responses short — credits add up fast
- Draft-first applies to voice too — preview before sending
