Following is a product case study which was submitted as an entry for the Impact AI Summit held in India on Feb-2026. 

Invitation for applications/startup ideas were accepted, along the themes of 'AI for All', 'People, Planet, and Progress', Digital Public Infrastructure (DPI), Democratizing AI resources, AI for Social Good amongst others.

It started with a very simple idea, 'Fixing the chronic mismanagement of building, repairing and maintenance of roads across India.' If in some ways Blockchain and AI, could be the answer to this deep rooted systemic issue, costing unprecedented amounts of opportunities, energies, time, tax payers' rupees and human lives. 

It’s a demonstration of my skills and my journey into Product Management through this exercise. I laid out the problem statement mentally, in a simple 'first-principles-way', identifying all the actors/stakeholders, defining constraints, incentives, thinking in systems, identifying clear failure points, establishing feedback loops that put this business/engineering problem onto a path of high/continuous growth trajectory and all the necessary thought processes when coming up with an MVP for a startup idea and extrapolating its wider impact/scope; if it were to hypothetically ever succeed as an idea. 

This was built around a basic understanding of Blockchain and AI; so many specifics/details may/may not be consistent in how the technology is adopted and used in its current form vs how it could be used. However, all the assumptions made in this exercise are consistent in how they are applied meaningfully.

# The Job The System Is Hired To Do

*When public infrastructure (roads) fails or is mismanaged, citizens, governments, contractors, and third parties need a shared version of ground truth they can all act on — because today, every actor runs on data they don't trust, corruption and ambiguity go unpunished, and repair decisions get made on narrative, lobbying, and paperwork — not evidence.*

Each actor hires the product for different — and connected — jobs.

## Citizen

**Jobs they hire it for:**

- *"When I see a broken road, help me report it once and trust it will actually matter — not vanish into a portal."*
- *"When my taxes fund road work, help me see exactly where the money went and what it bought."*
- *"When someone dies on a potholed road, help me prove who was accountable — and make sure it can never be buried."*
- *"When I report consistently and well, help me be heard and valued — not treated as noise."*
- *"When contracts are awarded, help me enforce meritocracy — the best-track-record contractor wins, not the best-connected one."*

**The Pain and the Solution:**

- <ins>Pain: reports get deleted/altered → Blockchain: hash-anchoring (Proof-of-Condition).</ins>

  - Report metadata (timestamp, location, condition score) is hashed and anchored after verification. Honest label: anchoring makes tampering detectable, not physically impossible — an admin can still edit the central database, but the original state lives on-chain and
  any auditor can differentiate the two. 


- <ins>Pain: no visibility into where tax money went → Blockchain: smart-contract payment trail + anchored Proof-of-Repair.</ins>
  
  - The chain records: bad state → repair claim → verified fix → payment release, per road segment (UAID). Honest label: this traces condition-to-payment truthfully; full budget-lineage (allocation → tender → contractor) is an extension the docs gesture at, not a built
  claim.


- <ins>Pain: deaths fade without accountability → Blockchain: the UAID as a permanent container.</ins>

  - Every 1-km segment holds its entire verified condition history. When a death occurs, the record of who reported what, when, and what the state did is unerasable. Honest label: the chain enables accountability; it doesn't auto-adjudicate blame.


- <ins>Pain: civic participation feels worthless → AI + tokens: CRT rewards for AI-verified reports.</ins>
  
  - Verified contributions earn a utility token (toll passes etc.) — honest effort becomes distinguishable and rewarded.


- <ins>Pain: tenders reward connections, not merit → Blockchain: reputation built only on immutable contract executions.</ins>
  
  - A contractor's record is assembled from smart-contract redemptions no one can rewrite — citizens holding contractor tokens (RCTs) literally price track record into the market. Honest label: "costlier token → better contractor" is an incentive design bet, not a
  measured outcome. 


## Government / Administrator

**Jobs they hire it for:**

- *"When I allocate repair budget, help me prioritize using verified evidence — so I can prove due diligence and defend the spend."*
- *"When I deal with corrupt insiders, help me make theft impossible rather than merely illegal."*
- *"When a contractor breaches the guarantee, help me recover the fines I levied — not just announce them."*
- *"When I sign a contract, help me verify the pre-conditions and outcomes I actually agreed to."*
- *"When timelines slip, help me stop the bleed automatically."*

**The Pain and the Solution:**

- <ins>Pain: prioritization runs on anecdote → AI: the Road Trust Score (RTS)</ins>
  - AI consolidates millions of noisy reports into a per-segment 0–100 score + heatmap; budget allocation queries this instead of complaints. **The most direct, unforced fit in the whole map.**

- <ins>Pain: corruption at every discretion point → Blockchain: trustless payment execution</ins>
  - Funds release only when pre-conditions verify (bad state on-chain → 10 independent citizen confirmations + AI re-check → auto-release). The middleman's discretion — the bribe point — is removed from *payment verification*.
  - Honest label: this hardens the **payment and verification** stages; tender award itself still needs process integrity upstream. The tech shrinks the corruption surface; it doesn't abolish it.

- <ins>Pain: fines stay on paper → Blockchain: staking + automatic penalty execution</ins>
  - Contractors stake a portion of repair cost upfront; if quality degrades inside the guarantee window (e.g., pothole reappears in 3 months), the smart contract deducts from the stake automatically. Recuperation becomes mechanical rather than political. **The strongest fit in the docs.**

- <ins>Pain: can't verify what was actually agreed/delivered → Blockchain + AI: the pre-condition check is the contract itself</ins>
  - Payment logic reads the immutable prior state and the post-repair verified state — "agreed outcome" becomes machine-readable, not a paperwork dispute.

- <ins>Pain: timeline slippage bleeds money silently → Blockchain: automated triggers on anchored events</ins>
  - Escalation/penalty logic fires on chain state rather than manual sign-off chains.

## Contractor (the honest ones)

**Jobs they hire it for:**

- *"When I do quality work, help me win the next contract on my record — not my lobby."*
- *"When I complete a repair, help me get paid fast and prove quality — without months of bureaucratic sign-off or disputes."*
- *"When bad actors win despite horrific track records, help me not compete against them on anything but work quality."*
- *"When I invest in doing the job right, help me put funds into materials and skill — not into bribes."*

**The Pain and the Solution:**

- <ins>Pain: paid 3–6 months late, 15–20% financing drag → Blockchain: instant smart-contract release on verification</ins>
  - Payment trigger fires on anchored Proof-of-Repair, not bureaucratic sign-off. Direct, unforced fit.

- <ins>Pain: can't win without lobbying** → Blockchain: Digital Reputation Score from immutable history only</ins>
  - Verifiable performance becomes the tender currency ("Trust Passport") — win on record, not relationships.
    
- <ins>Pain: bad actors keep winning → Blockchain: history follows the firm</ins>
  - Failed contracts, fines, and disputes are permanently attached to their identity; the market can price it.
    
- <ins>Pain: capital goes to bribes, not quality → Token framework: RCTs as performance-backed assets</ins>
  - Contractors can raise capital or borrow against tokens whose value tracks their immutable work record — honest work finally has a financial return path.
  - Honest label: the most speculative element of the design; an incentive architecture, not an operating feature of the MVP.


## Auditor / Insurer / Financier / Third party

**Jobs they hire it for:**

- *"When I assess risk or verify claims, help me see an incorruptible history of this asset — not self-reported data."*

**The Pain and the Solution:**

- <ins>Pain: no independent condition history → Both, in sequence: AI-scored, blockchain-certified time-series per segment</ins>
  - The "Immutable Training Pool" doubles as a premium risk dataset — RTS history for underwriting, bond pricing, liability premiums. This is where the data asset becomes a product.

## The system itself (civic trust)

**Jobs it is hired for:**

- *"When any party alters, hides, or fabricates the record, help the truth survive anyway."*

**The Pain and the Solution:**

- Every actor distrusts every other; trust is rebuilt person-by-person and lost institution-by-institution.
