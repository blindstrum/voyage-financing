# Subagent Reference — Voyage Financing Calculator Pages

## CRITICAL: Read existing page for template
Use `/home/user/workspace/voyage-financing/affordability.html` as your structural template. Copy its exact:
- DOCTYPE, head (meta tags, fonts, stylesheets: base.css + style.css)
- Starfield div, page-content wrapper
- Utility bar (same across all pages)
- Header/nav (same across all pages — copy EXACTLY from affordability.html)
- Footer (same across all pages — copy EXACTLY from affordability.html)
- Chatbot widget script (same across all pages)
- Scroll-to-top button

## Page Structure Pattern
```
<!DOCTYPE html> ... head with base.css + style.css ...
<body>
  <div class="starfield"></div>
  <div class="page-content">
    <!-- UTILITY BAR --> (copy from affordability.html)
    <!-- HEADER/NAV --> (copy from affordability.html)
    <!-- HERO --> page-specific hero section
    <!-- CALCULATOR --> the actual calculator with inputs + results
    <!-- CTA BAND --> call to action section
    <!-- FOOTER --> (copy from affordability.html)
    <!-- SCROLL TOP --> button
  </div>
  <!-- CHATBOT --> widget (copy from affordability.html)
  <script src="./chatbot.js"></script>
</body>
```

## Design System
- Fonts: Space Grotesk (display/headings), Montserrat (body)
- Background: Space theme (dark void #06091A)
- Primary color: #3ECFCF (teal)
- Accent: #8B5CF6 (nebula purple)
- Gold: #F5C842
- Cards: rgba(26,37,80,0.4) with border rgba(255,255,255,0.08)
- Text: #C8D0E8 (main), #7B89B0 (muted), #4A5580 (faint)
- Use CSS variables from style.css (--color-primary, --space-void, etc.)

## Calculator UI Pattern
- Two-column layout on desktop (inputs left, results right)
- Single column on mobile
- Use range sliders with displayed values
- Results panel should be sticky on desktop
- Use <style> tag in page head for page-specific styles
- All inline JS at bottom of page (no external JS files needed except chatbot.js)
- Use tabular-nums for numerical displays
- Include disclaimer: "These calculations are estimates for educational purposes only. Actual results may vary based on your specific situation. Contact a Voyage Home Loans loan officer for personalized guidance."

## Company Info
- Company: LL Financial LLC DBA Voyage Home Loans
- NMLS#: 2667229
- Phone: (414) 309-6013
- Email: team@voyagefinancing.com
- Address: N88W16447 Main Street, Suite 200, Menomonee Falls, Wisconsin 53051
- Licensed in: Wisconsin, Iowa, Florida

## Important
- Do NOT use any external JS libraries — vanilla JS only
- Do NOT change the nav structure (it will be updated separately)
- DO include page-specific <style> in the head
- DO include the chatbot widget at the bottom
- The file should be fully self-contained and work with existing base.css + style.css
