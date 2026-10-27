---
description: UI/UX Pro Max — дизайн-интеллект: 84 стиля, 192 цветовые палитры, 74 шрифтовые пары, 98 UX-правил across 22 стека
---

Activate the UI/UX Pro Max skill for comprehensive design intelligence.

1. Read the skill file at `~/.windsurf/skills/ui-ux-pro-max/SKILL.md` to load the full design instructions.
2. Use the search tool for design recommendations:
   ```bash
   python ~/.windsurf/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "Project Name"
   ```
3. Follow the skill workflow:
   - Step 1: Analyze user requirements (product type, audience, style keywords, stack)
   - Step 2: Generate design system with `--design-system` flag
   - Step 3: Supplement with detailed domain searches as needed (`--domain style`, `--domain color`, `--domain typography`, etc.)
   - Step 4: Apply stack-specific guidelines (`--stack react`, `--stack nextjs`, etc.)
4. Synthesize all recommendations and implement them in the code.
5. Run through the Pre-Delivery Checklist from `references/pro-rules.md` before finishing.

The user's request after the slash command is the task to execute:
$ARGUMENTS
