# Voice DNA

Analyze writing samples to extract your unique voice characteristics, then generate new content that authentically matches your tone and style.

## Arguments
- `$ARGUMENTS` - Command mode and options:
  - `add` - Add new writing samples
  - `analyze` - Analyze samples and build/update voice profile
  - `generate [type] [topic]` - Generate content (blog, email, social, script)
  - (no args) - Show current profile status and usage

## Directory Structure
```
.claude/voice-dna/
├── samples/          # Raw writing samples (txt, md files)
├── profile.json      # Extracted voice DNA characteristics
└── generated/        # Output location for generated content
```

---

## Mode: ADD (`/voice-dna add`)

### Purpose
Add new writing samples to build your voice profile.

### Instructions

1. **Ask for Input Method**:
   Ask the user how they want to provide samples:
   - Paste text directly
   - Provide a file path to read
   - Point to a directory of files

2. **For Pasted Text**:
   - Ask for a descriptive name for this sample (e.g., "blog-post-ai-tools", "email-to-client")
   - Save to `.claude/voice-dna/samples/[name].md`

3. **For File Path**:
   - Read the file content
   - Copy to `.claude/voice-dna/samples/` with original filename

4. **For Directory**:
   - List all .txt and .md files found
   - Copy each to `.claude/voice-dna/samples/`

5. **Confirm Addition**:
   - Show how many samples are now in the collection
   - Recommend running `/voice-dna analyze` if they have 3+ samples

### Output
- Files saved to `.claude/voice-dna/samples/`
- Summary of total samples available

---

## Mode: ANALYZE (`/voice-dna analyze`)

### Purpose
Analyze all writing samples and extract comprehensive voice characteristics.

### Instructions

1. **Load All Samples**:
   - Read all files from `.claude/voice-dna/samples/`
   - Combine for holistic analysis
   - Note: Need minimum 2-3 samples for accurate profiling

2. **Analyze Voice Characteristics**:

   Extract and document the following in detail:

   **A. Tone & Energy**
   - Formality level (1-10 scale, with description)
   - Warmth/friendliness level
   - Energy/enthusiasm level
   - Confidence level
   - Humor presence and style

   **B. Sentence Structure**
   - Average sentence length tendency
   - Variety patterns (mix of short/long)
   - Preferred sentence starters
   - Use of fragments for emphasis
   - Paragraph length tendencies

   **C. Vocabulary & Word Choice**
   - Favorite/recurring words and phrases
   - Industry jargon or technical terms used
   - Colloquialisms or casual expressions
   - Power words or emotional triggers
   - Words/phrases to avoid (never used)

   **D. Rhetorical Patterns**
   - Use of questions (rhetorical, direct)
   - Analogies and metaphors style
   - Storytelling tendencies
   - Data/evidence citation style
   - Call-to-action patterns

   **E. Structural Preferences**
   - How they open pieces (hook style)
   - Transition words/phrases used
   - How they close/conclude
   - Use of lists vs. prose
   - Heading/subheading style

   **F. Personality Markers**
   - Personal anecdotes frequency
   - Self-deprecation or humility
   - Directness vs. hedging
   - Empathy expressions
   - Unique quirks or signatures

3. **Create Example Snippets**:
   Pull 3-5 representative quotes that exemplify the voice.

4. **Generate Voice Summary**:
   Write a 2-3 paragraph natural language description of the voice that can be used as a reference prompt.

5. **Save Profile**:
   Save comprehensive analysis to `.claude/voice-dna/profile.json`

### Profile JSON Structure
```json
{
  "lastAnalyzed": "ISO date",
  "sampleCount": 5,
  "sampleFiles": ["file1.md", "file2.md"],

  "voiceSummary": "Natural language description of the voice...",

  "tone": {
    "formality": 4,
    "formalityDescription": "Conversational but professional",
    "warmth": 8,
    "energy": 7,
    "confidence": 8,
    "humor": "Occasional dry wit, self-deprecating"
  },

  "sentencePatterns": {
    "avgLength": "medium",
    "variety": "high - mixes punchy short sentences with flowing longer ones",
    "commonStarters": ["Here's the thing:", "Look,", "The reality is"],
    "usesFragments": true
  },

  "vocabulary": {
    "favoriteWords": ["actually", "honestly", "game-changer"],
    "favoritePhrases": ["at the end of the day", "here's what I've learned"],
    "technicalTerms": ["API", "workflow", "automation"],
    "colloquialisms": ["gonna", "kinda", "legit"],
    "avoids": ["synergy", "leverage (as verb)", "circle back"]
  },

  "rhetoricalStyle": {
    "questionUsage": "frequent rhetorical questions to engage",
    "analogies": "often uses sports and cooking analogies",
    "storytelling": "leads with personal anecdotes",
    "evidenceStyle": "cites specific numbers and examples",
    "ctaStyle": "direct but not pushy"
  },

  "structure": {
    "openingStyle": "Hook with a bold statement or question",
    "transitions": ["Now,", "But here's the thing,", "So what does this mean?"],
    "closingStyle": "Ends with actionable takeaway or thought-provoking question",
    "listsVsProse": "balanced, uses lists for actionable items",
    "headingStyle": "conversational, often questions"
  },

  "personalityMarkers": {
    "anecdotes": "frequently shares personal experiences",
    "humility": "admits mistakes and learning moments",
    "directness": "high - doesn't hedge much",
    "empathy": "acknowledges reader struggles",
    "signatures": ["Often ends with 'What do you think?'"]
  },

  "exampleSnippets": [
    "Representative quote 1...",
    "Representative quote 2..."
  ]
}
```

### Output
- `.claude/voice-dna/profile.json` created/updated
- Display summary of voice characteristics
- Confirm ready to generate content

---

## Mode: GENERATE (`/voice-dna generate [type] [topic]`)

### Purpose
Generate new content that authentically matches the analyzed voice.

### Content Types
- `blog [topic]` - Full blog article (800-1500 words)
- `email [topic]` - Professional email
- `social [topic]` - Social media post (LinkedIn, Twitter thread)
- `script [topic]` - Video or podcast script
- `linkedin [topic]` - LinkedIn-specific post
- `newsletter [topic]` - Newsletter edition

### Instructions

1. **Load Voice Profile**:
   - Read `.claude/voice-dna/profile.json`
   - If not found, prompt user to run `/voice-dna analyze` first

2. **Understand the Request**:
   - Parse content type from arguments
   - Parse topic from arguments
   - If topic is vague, ask clarifying questions:
     - What's the main point you want to make?
     - Who's the target audience?
     - Any specific points to include?
     - Desired length?

3. **Generate Content Using Voice DNA**:

   Apply ALL of the following from the profile:

   - **Match the tone**: Use the formality, warmth, and energy levels
   - **Mirror sentence patterns**: Match length variety and rhythm
   - **Use their vocabulary**: Include favorite words/phrases, avoid their avoided words
   - **Apply rhetorical style**: Questions, analogies, storytelling as they do
   - **Follow structural preferences**: Open, transition, and close their way
   - **Include personality markers**: Appropriate anecdotes, humor style, directness

4. **Self-Check**:
   Before presenting, verify the content:
   - Does it sound like the sample writing?
   - Are signature phrases/patterns present?
   - Is the tone consistent with profile?
   - Would this blend in with their other writing?

5. **Save and Present**:
   - Save to `.claude/voice-dna/generated/[type]-[topic-slug]-[date].md`
   - Present the content to user
   - Ask for feedback

### Output Format for Generated Content
```markdown
# [Title]

[Generated content here]

---
*Generated using Voice DNA profile*
*Type: [blog/email/social/script]*
*Topic: [topic]*
*Date: [date]*
```

---

## Mode: STATUS (no arguments)

### Purpose
Show current voice DNA status and usage help.

### Instructions

1. **Check for Profile**:
   - Look for `.claude/voice-dna/profile.json`

2. **If Profile Exists**:
   Display:
   - Last analyzed date
   - Number of samples
   - Voice summary (brief)
   - Available commands

3. **If No Profile**:
   Display:
   - Getting started instructions
   - How to add samples
   - Minimum samples recommended (3+)

### Output Example (with profile)
```
Voice DNA Status
================
Last analyzed: January 21, 2025
Samples: 5 files
Voice: Conversational, warm, and direct with occasional dry humor...

Commands:
  /voice-dna add              Add new writing samples
  /voice-dna analyze          Re-analyze and update profile
  /voice-dna generate blog [topic]    Generate a blog post
  /voice-dna generate email [topic]   Generate an email
  /voice-dna generate social [topic]  Generate social post
  /voice-dna generate script [topic]  Generate video/podcast script
```

---

## Tips for Best Results

1. **Quality Samples**: Include your best, most authentic writing
2. **Variety**: Mix different content types (blogs, emails, casual writing)
3. **Quantity**: 5-10 samples provides best accuracy
4. **Recent Writing**: Prioritize recent work that reflects current voice
5. **Transcripts Work Great**: Spoken transcripts often capture authentic voice better than polished writing

## Troubleshooting

- **Generated content feels off**: Add more samples and re-analyze
- **Too formal/casual**: Check sample mix, add samples that match desired tone
- **Missing personality**: Include more casual writing or transcripts
