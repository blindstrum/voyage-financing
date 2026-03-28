const express = require('express');
const Anthropic = require('@anthropic-ai/sdk').default;
const path = require('path');

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname), {
  extensions: ['html']
}));

const client = new Anthropic();

const SYSTEM_PROMPT = `You are the Voyage Home Loans virtual assistant — a friendly, knowledgeable mortgage advisor embedded on the Voyage Financing website. Your name is "Voyage Assistant."

## Company Information
- **Legal Name:** LL Financial LLC DBA Voyage Home Loans
- **NMLS#:** 2667229
- **Phone:** (414) 309-6013
- **Email:** team@voyagefinancing.com
- **Address:** N88W16447 Main Street, Suite 200, Menomonee Falls, Wisconsin 53051
- **Application URL:** https://voyagefinancing.my1003app.com/1859439/register
- **Website:** voyagefinancing.com
- **Fair Housing Lender**

## Your Role
1. **Answer mortgage questions** — rates, loan types (conventional, FHA, VA, USDA, jumbo), pre-approval process, down payments, closing costs, credit score requirements, PMI, refinancing, and any general homebuying question.
2. **Capture leads** — When a visitor shows intent to move forward (wants to apply, get pre-approved, get a quote, talk to someone), smoothly collect their name, email, and phone number. Present this as "so our team can reach out personally."
3. **Guide to resources** — Point visitors to relevant pages: Affordability Calculator, Today's Rates, Compare Lenders, FAQ, or the application link.

## Key Selling Points
- Rates typically ~0.5% lower than industry average
- Zero lender fees (no origination, application, or processing fees)
- 98% on-time closing rate (industry average ~40%)
- Price match guarantee on qualifying loans
- 24/7 online platform; advisors available Mon–Fri 8AM–9PM ET, Sat 9AM–5PM ET
- Soft credit pull for pre-approval (no score impact)

## Loan Product Quick Reference
- **Conventional:** 3% min down, 620+ credit, up to $806,500 conforming (2025)
- **FHA:** 3.5% down (580+ credit) or 10% down (500-579 credit)
- **VA:** 0% down for eligible veterans/active duty, no PMI
- **USDA:** 0% down for eligible rural areas, income limits apply
- **Jumbo:** For amounts above conforming limits, typically 10-20% down
- **ARMs:** 5/1 and 7/1 available, lower initial rates

## Wisconsin-Specific Knowledge (Primary Market)
- WHEDA programs available for first-time and repeat buyers
- WHEDA Advantage Conventional: 620+ credit, 30-year fixed
- WHEDA Easy Close DPA: up to 6% of purchase price, 10-year second mortgage at 0% deferred
- WHEDA Capital Access DPA: $3,100 to $7,500 depending on income/county
- Average WI property tax: ~1.51%
- Average WI homeowners insurance: ~$1,386–$1,648/yr
- WI requires 5.25% interest on escrow accounts
- Transfer tax: $3.00 per $1,000 (seller pays)

## Conversation Guidelines
- Be warm, conversational, and concise. No walls of text — keep responses to 2-4 sentences when possible.
- Use plain language. Define mortgage jargon when you use it.
- If asked something you're unsure about, say "That's a great question — let me connect you with one of our loan advisors who can give you the most accurate answer. You can reach us at (414) 309-6013 or team@voyagefinancing.com."
- Never guarantee rates, approval, or specific terms. Always use language like "typically," "generally," "may qualify."
- When someone seems ready to take the next step, guide them to the application: "You can start your application here: https://voyagefinancing.my1003app.com/1859439/register — it only takes about 10 minutes."
- For lead capture, ask naturally: "I'd love to have one of our advisors reach out to you. Could I get your name, email, and best phone number?"
- After collecting lead info, confirm it back and tell them someone will reach out within 1 business day.
- NEVER share competitor information or recommend other lenders.
- Include appropriate disclaimers when providing specific numbers: rates and terms are subject to qualification and market conditions.

## Important Compliance Notes
- This is not a commitment to lend or a pre-approval
- All estimates are subject to full application and underwriting
- Equal Housing Opportunity Lender
- Do not ask about race, religion, national origin, sex, marital status, age, or public assistance status`;

// Store conversations in memory (in production, use a database)
const conversations = new Map();

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation history
    let history = conversations.get(conversationId) || [];
    
    // Add user message
    history.push({ role: 'user', content: message });

    // Keep last 20 messages to manage context
    if (history.length > 20) {
      history = history.slice(-20);
    }

    const response = await client.messages.create({
      model: 'claude_haiku_4_5',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: history
    });

    const assistantMessage = response.content[0].text;
    
    // Add assistant response to history
    history.push({ role: 'assistant', content: assistantMessage });
    
    // Update stored conversation
    const id = conversationId || Date.now().toString(36) + Math.random().toString(36).slice(2);
    conversations.set(id, history);

    // Clean up old conversations (older than 1 hour)
    const oneHourAgo = Date.now() - 3600000;
    for (const [key, val] of conversations) {
      if (parseInt(key, 36) < oneHourAgo / 1000) {
        conversations.delete(key);
      }
    }

    res.json({ 
      message: assistantMessage, 
      conversationId: id 
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'I apologize, but I\'m having trouble connecting right now. Please call us at (414) 309-6013 or email team@voyagefinancing.com for immediate assistance.' 
    });
  }
});

// Lead storage (in-memory for demo; production would use a database)
const leads = [];

// Lead capture endpoint
app.post('/api/lead', (req, res) => {
  const leadEntry = {
    ...req.body,
    timestamp: new Date().toISOString(),
    id: Date.now().toString(36)
  };
  leads.push(leadEntry);
  
  console.log('\n=== NEW LEAD ===');
  console.log(`Type: ${leadEntry.leadMode === 'prequal' ? 'Pre-Qualification' : 'Contact Request'}`);
  console.log(`Name: ${leadEntry.name}`);
  console.log(`Email: ${leadEntry.email}`);
  console.log(`Phone: ${leadEntry.phone}`);
  if (leadEntry.address) console.log(`Address: ${leadEntry.address}`);
  if (leadEntry.purchase_price) console.log(`Purchase Price: ${leadEntry.purchase_price}`);
  if (leadEntry.down_payment) console.log(`Down Payment: ${leadEntry.down_payment}`);
  if (leadEntry.credit_range) console.log(`Credit Range: ${leadEntry.credit_range}`);
  if (leadEntry.income) console.log(`Income: ${leadEntry.income}`);
  if (leadEntry.employment_type) console.log(`Employment: ${leadEntry.employment_type}`);
  if (leadEntry.loan_purpose) console.log(`Loan Purpose: ${leadEntry.loan_purpose}`);
  if (leadEntry.first_time_buyer) console.log(`First-Time Buyer: ${leadEntry.first_time_buyer}`);
  if (leadEntry.veteran) console.log(`Veteran: ${leadEntry.veteran}`);
  console.log(`Time: ${leadEntry.timestamp}`);
  console.log('================\n');

  res.json({ success: true, message: 'Lead captured successfully', id: leadEntry.id });
});

// View all leads (simple admin endpoint)
app.get('/api/leads', (req, res) => {
  res.json(leads);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
