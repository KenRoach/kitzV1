# SOP: Voice Brain Dump Processing

## Purpose
Transform raw voice memos from business owners into structured, actionable items (tasks, ideas, notes, follow-ups, decisions).

## Trigger
- WhatsApp audio message received
- Web app voice recording submitted
- Scheduled voice check-in (daily brain dump prompt)

## Flow
1. **Receive audio** → WhatsApp connector or web upload
2. **Transcribe** → `brain/skills/callTranscription.ts` (Whisper via LLM Hub)
3. **Process** → `brain/skills/voiceBrainDump.ts` (Sonnet tier — needs reasoning)
4. **Route items** → Tasks → workspace CRM tasks, Ideas → notes, Follow-ups → calendar
5. **Confirm** → Send summary back to user via WhatsApp (draft-first)

## AI Battery Cost
- Transcription: ~0.5 credits
- Brain dump processing: ~1.0 credits
- Total per dump: ~1.5 credits

## Quality Checks
- [ ] Every item in transcript captured (nothing lost)
- [ ] Priorities assigned based on business impact
- [ ] Related contacts linked when mentioned by name
- [ ] Due dates extracted when mentioned ("mañana", "esta semana", etc.)
- [ ] Summary is 2-3 sentences max

## Reference Repos
- WhisperLive — real-time Whisper STT
- Scriberr — self-hosted transcription
- NotelyVoice — on-device voice notes
- OpenWhispr — local + cloud dictation
