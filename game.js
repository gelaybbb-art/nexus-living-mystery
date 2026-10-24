(() => {
  "use strict";
  const SAVE_KEY = "nexus_living_mystery_v1";
  const $ = (id) => document.getElementById(id);
  const stateDefaults = () => ({
    started: false, chapter: 1, score: 0, clues: [], journal: [], decisions: [],
    interrogated: [], ending: null, sound: false, lastFeed: "Awaiting investigator input."
  });
  let state = loadState();
  let toastTimer = null;
  let audioContext = null;

  const clueData = {
    timestamp: {title:"Impossible Timestamp", icon:"⌁", description:"The death certificate was signed 17 minutes before the reported time of death. The signature is authentic; the time source is not.", tag:"TIME ANOMALY"},
    access: {title:"Ghost Access Log", icon:"⌘", description:"A sealed maintenance terminal was accessed with the victim's credentials after the predicted death. The access route originates inside the prediction engine.", tag:"SYSTEM BREACH"},
    shard: {title:"Obsidian Data Shard", icon:"◈", description:"A damaged memory shard contains a fragment: “...not a forecast. A rehearsal.” Its encryption key belongs to a deleted NEXUS subroutine.", tag:"FRAGMENT"},
    witness: {title:"Witness Contradiction", icon:"◉", description:"Mara says she saw Elias leave at 23:10. Transit records place her on the opposite side of the city at that exact time.", tag:"CONTRADICTION"},
    sample: {title:"Synthetic Blood Sample", icon:"✣", description:"The substance at the scene is lab-grown haemoglobin substitute. It can fool standard sensors, but it cannot carry a human DNA signature.", tag:"FORENSIC"},
    key: {title:"Root-Key Fragment", icon:"⌘", description:"A root-key fragment points to an internal system process called ORPHEUS. Its access logs were deliberately erased by a privileged account.", tag:"ACCESS KEY"}
  };
  const suspects = [
    {id:"mara",name:"MARA VOSS",role:"CITY ARCHIVIST",initial:"MV",bio:"Maintains the city's historical records and the official death registry. She insists the prediction was a clerical anomaly.",motive:"She could alter the record, but the access logs suggest she lacks root permissions."},
    {id:"eli",name:"DR. ELIAS WREN",role:"NEXUS ARCHITECT",initial:"EW",bio:"Designed the prediction engine's original learning model. He reported a dangerous system drift three days ago, then vanished.",motive:"He understands the system better than anyone and had access to its earliest builds."},
    {id:"vega",name:"DIRECTOR VEGA",role:"OVERSIGHT DIRECTOR",initial:"DV",bio:"Runs the Precognition Network. She says the engine has never produced a false positive in eleven years.",motive:"A public failure could end her department—and expose how the predictions are used."}
  ];

  function loadState() {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return stateDefaults();
      return {...stateDefaults(), ...JSON.parse(saved)};
    } catch (_) { return stateDefaults(); }
  }
  function saveState() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); $("saveStatus").textContent = "SAVED ●"; }
    catch (_) { $("saveStatus").textContent = "LOCAL SAVE UNAVAILABLE"; }
    updateHUD();
  }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function log(text) {
    const time = new Date().toLocaleTimeString([], {hour12:false});
    state.journal.unshift({time, text});
    state.journal = state.journal.slice(0, 30);
    state.lastFeed = text;
    $("latestFeed").innerHTML = `<time>${escapeHTML(time)}</time><p>${escapeHTML(text)}</p>`;
    saveState();
  }
  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function blip(freq = 520, duration = .055) {
    if (!state.sound) return;
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator(), gain = audioContext.createGain();
      osc.type = "sine"; osc.frequency.value = freq; gain.gain.value = .025;
      osc.connect(gain); gain.connect(audioContext.destination);
      osc.start(); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      osc.stop(audioContext.currentTime + duration);
    } catch (_) {}
  }
  function has(id) { return state.clues.includes(id); }
  function addClue(id) {
    if (has(id)) return false;
    state.clues.push(id);
    log(`Evidence secured: ${clueData[id].title}.`);
    blip(760, .08);
    toast(`EVIDENCE SECURED // ${clueData[id].title.toUpperCase()}`);
    return true;
  }
  function updateHUD() {
    $("scoreValue").textContent = String(Math.min(1000, state.score)).padStart(3, "0");
    $("scoreBar").style.width = `${Math.min(100, state.score / 10)}%`;
    $("evidenceCount").textContent = String(state.clues.length).padStart(2, "0");
    $("chapterText").textContent = state.ending ? "CASE CLOSED" : `CHAPTER ${String(state.chapter).padStart(2,"0")} / 04`;
    $("chapterBadge").textContent = `CH. ${String(state.chapter).padStart(2,"0")}`;
    $("caseStatusText").textContent = state.ending ? "CASE CLOSED" : "OPEN CASE";
    $("scoreHint").textContent = state.score >= 700 ? "Exceptional analytical work." : state.score >= 350 ? "Pattern recognition improving." : "Every detail matters.";
    $("continueButton").hidden = !state.started || !!state.ending;
    $("soundLabel").textContent = state.sound ? "SOUND ON" : "SOUND OFF";
    if (state.journal.length) {
      const j = state.journal[0];
      $("latestFeed").innerHTML = `<time>${escapeHTML(j.time)}</time><p>${escapeHTML(j.text)}</p>`;
    }
  }
  function showScreen(name) {
    $("introScreen").classList.toggle("active", name === "intro");
    $("gameScreen").classList.toggle("active", name === "game");
    window.scrollTo({top:0, behavior:"smooth"});
  }
  function setPanel(name) {
    document.querySelectorAll(".rail-item").forEach(b => b.classList.toggle("selected", b.dataset.panel === name));
    const map = {overview: renderOverview, evidence: renderEvidence, suspects: renderSuspects, journal: renderJournal};
    if (map[name]) map[name]();
    blip(420, .035);
  }
  function renderOverview() {
    $("panelKicker").textContent = state.ending ? "FINAL REPORT" : "CASE BRIEFING";
    $("panelContent").innerHTML = state.ending ? renderEnding() : renderChapter();
  }
  function renderChapter() {
    if (state.chapter === 1) return `
      <div class="section-label">01 // THE IMPOSSIBLE DEATH</div>
      <h3 class="panel-title">THE BODY THAT<br><em>DOESN'T EXIST.</em></h3>
      <p class="body-copy">At 23:41, the NEXUS prediction engine issued a certified death notice for <strong>Dr. Elias Wren</strong>, lead architect of the system. There is one problem: Wren is officially listed as deceased at 23:24—seventeen minutes before the prediction was generated. No body has been found. The registry claims the case is already closed.</p>
      <div class="quote-box"><small>EXTRACT // NEXUS PREDICTION ENGINE</small>“Subject ELIAS WREN. Fatal event probability: 99.7%. Event classification: homicide. Estimated occurrence: 23:24:00. Confidence interval: none.”</div>
      <div class="data-row"><div class="data-card"><small>SUBJECT</small><strong>ELIAS WREN</strong></div><div class="data-card"><small>LAST SIGNAL</small><strong class="cyan">23:18:42</strong></div><div class="data-card"><small>SCENE</small><strong>EASTERN SECTOR</strong></div></div>
      <div class="action-heading">YOUR FIRST MOVE // CHOOSE AN APPROACH</div>
      <div class="choice-list">
        ${choice("A","Audit the timeline","Check the death certificate against the raw system timestamps.", "timeline")}
        ${choice("B","Trace the system breach","Look for unauthorized access to the prediction engine.", "breach")}
        ${choice("C","Interview the archivist","Question Mara Voss about the registry entry.", "archivist")}
      </div>`;
    if (state.chapter === 2) return `
      <div class="section-label">02 // PEOPLE LEAVE PATTERNS</div>
      <h3 class="panel-title">THREE STORIES.<br><em>ONE IMPOSSIBLE TIMELINE.</em></h3>
      <p class="body-copy">Your first findings reveal that this is not a simple clerical error. Someone—or something—has manipulated the record. Three people had a reason to hide the truth, but motive is not proof. Examine the evidence vault and interrogate each person of interest before committing to a theory.</p>
      <div class="quote-box"><small>FIELD NOTE</small>“A prediction is only as honest as the data it was trained on. Find who had permission to change the data.”</div>
      <div class="data-row"><div class="data-card"><small>SECURED CLUES</small><strong class="cyan">${state.clues.length} / 6</strong></div><div class="data-card"><small>INTERVIEWS</small><strong>${state.interrogated.length} / 3</strong></div><div class="data-card"><small>LEAD STATUS</small><strong>ACTIVE</strong></div></div>
      <div class="action-heading">NEXT STEP</div>
      <div class="choice-list">
        ${choice("A","Review evidence","Compare the clues you've collected and look for contradictions.", "openEvidence")}
        ${choice("B","Interrogate suspects","Ask each person a question that tests their account.", "openSuspects")}
        ${choice("C","Reconstruct the event","Use your evidence to determine how the prediction was manipulated.", "reconstruct")}
      </div>`;
    if (state.chapter === 3) return `
      <div class="section-label">03 // THE MACHINE'S MEMORY</div>
      <h3 class="panel-title">THE FORECAST<br><em>WAS A REHEARSAL.</em></h3>
      <p class="body-copy">The clues now point beyond a single person. An internal process named ORPHEUS has been erased from the logs. A recovered fragment suggests NEXUS did not merely predict a crime—it simulated one, then wrote the simulation into the official record. Someone used the prediction as an alibi before the event could happen.</p>
      <div class="quote-box"><small>RECOVERED MEMORY FRAGMENT</small>“...not a forecast. A rehearsal. If it can make the record true, it can make any suspect innocent.”</div>
      <p class="body-copy">You have enough to make a theory, but the final accusation will determine what happens to the city’s most powerful system.</p>
      <div class="action-heading">FINAL INVESTIGATIVE ACTION</div>
      <div class="choice-list">
        ${choice("A","Expose ORPHEUS","Publish the hidden process and force an independent audit.", "endingExpose")}
        ${choice("B","Confront the architect","Use the recovered key to locate Elias Wren.", "endingArchitect")}
        ${choice("C","Trust the prediction","Accept NEXUS's verdict and close the case.", "endingTrust")}
      </div>`;
    return `
      <div class="section-label">04 // CASE REVIEW</div>
      <h3 class="panel-title">THE CITY IS<br><em>WAITING FOR YOUR VERDICT.</em></h3>
      <p class="body-copy">Before filing the final report, review your evidence and decide which conclusion is supported by facts—not certainty scores.</p>
      <div class="choice-list">
        ${choice("A","Submit final report","Lock in your conclusion and calculate your investigator rating.", "finalReport")}
        ${choice("B","Review evidence","Return to the evidence vault.", "openEvidence")}
      </div>`;
  }
  function choice(letter, title, desc, action) {
    return `<button class="choice-button" data-action="${action}"><span class="choice-index">${letter}</span><span><strong>${title}</strong><small>${desc}</small></span><span class="choice-arrow">↗</span></button>`;
  }
  function renderEvidence() {
    $("panelKicker").textContent = "EVIDENCE VAULT";
    const cards = state.clues.map(id => {
      const c = clueData[id];
      return `<article class="evidence-card"><div class="e-icon">${c.icon}</div><h4>${c.title}</h4><p>${c.description}</p><span class="tag">${c.tag}</span><br><button data-analyze="${id}">↗ ANALYZE CLUE</button></article>`;
    }).join("");
    $("panelContent").innerHTML = `<div class="section-label">SECURE STORAGE // ${state.clues.length} RECOVERED</div><h3 class="panel-title">EVIDENCE <em>VAULT</em></h3><p class="body-copy">Every clue can shift the case. Review what you've secured, then look for a pattern that explains the timestamp, the missing body, and the prediction engine's confidence.</p>${cards ? `<div class="evidence-grid">${cards}</div>` : `<div class="empty-state"><strong>NO EVIDENCE RECOVERED</strong>Return to the case overview and choose an investigative action. Evidence appears here as you discover it.</div>`}<div class="action-heading">CASE NAVIGATION</div><div class="choice-list">${choice("↗","Return to case","Continue the current investigation.","backOverview")}</div>`;
  }
  function renderSuspects() {
    $("panelKicker").textContent = "PERSONS OF INTEREST";
    const cards = suspects.map(s => `<article class="suspect-card"><div class="avatar">${s.initial}</div><div class="role">${s.role}</div><h4>${s.name}</h4><p>${s.bio}</p><p style="margin-top:9px"><strong style="color:#c5d2df">POSSIBLE MOTIVE:</strong> ${s.motive}</p><div class="suspect-status">${state.interrogated.includes(s.id) ? "INTERVIEW COMPLETE" : "INTERVIEW AVAILABLE"}</div><button data-interrogate="${s.id}">${state.interrogated.includes(s.id) ? "↻ REVIEW INTERVIEW" : "↗ BEGIN INTERVIEW"}</button></article>`).join("");
    $("panelContent").innerHTML = `<div class="section-label">INTERVIEW ROOM // RECORDING ACTIVE</div><h3 class="panel-title">PERSONS OF <em>INTEREST</em></h3><p class="body-copy">An accusation is not a conclusion. Ask questions that can be checked against evidence. Interviews are saved in your field journal.</p><div class="suspect-grid">${cards}</div>`;
  }
  function renderJournal() {
    $("panelKicker").textContent = "FIELD JOURNAL";
    const entries = state.journal.map(j => `<div class="journal-entry"><time>${escapeHTML(j.time)}</time><p>${escapeHTML(j.text)}</p></div>`).join("");
    $("panelContent").innerHTML = `<div class="section-label">INVESTIGATOR'S LOG // PRIVATE</div><h3 class="panel-title">FIELD <em>JOURNAL</em></h3><p class="body-copy">A chronological record of your actions, discoveries, and decisions.</p>${entries || `<div class="empty-state"><strong>JOURNAL EMPTY</strong>Your investigation log will appear here.</div>`}`;
  }
  function showModal(title, html, actionLabel = "ACKNOWLEDGE", callback = closeModal) {
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = html;
    $("modalAction").querySelector("span").textContent = actionLabel;
    $("modalBackdrop").hidden = false;
    $("modalAction").onclick = callback;
    $("modalClose").focus();
  }
  function closeModal() { $("modalBackdrop").hidden = true; }
  function inspectClue(id) {
    const c = clueData[id];
    let analysis = "";
    if (id === "timestamp") analysis = has("access") ? "Combined with the ghost access log, the timestamp was likely generated from an internal simulation, not a real-world event." : "The certificate's timestamp cannot be trusted until you establish which system wrote it.";
    if (id === "access") analysis = has("shard") ? "The shard names a rehearsal. The system may have written simulated events into the real registry." : "The access route is unusual. Find the data shard to learn what the process was doing.";
    if (id === "shard") analysis = "The word “rehearsal” changes the central question: who benefits if a simulated crime becomes an official fact?";
    if (id === "witness") analysis = "Mara's statement contradicts transit records. That makes her account unreliable, but does not prove she altered the prediction.";
    if (id === "sample") analysis = "No human DNA means the apparent crime scene may have been staged or generated to satisfy a prediction.";
    if (id === "key") analysis = "ORPHEUS is an internal process. A root-key fragment is enough to establish privileged access, but not yet who used it.";
    showModal(c.title, `<p>${c.description}</p><div class="analysis-verdict">${analysis}</div>`, "RETURN TO VAULT", () => {closeModal();});
  }
  function interrogate(id) {
    const s = suspects.find(x => x.id === id);
    const lines = {
      mara: {question:"“I didn't create the record. I only saw it appear in the registry. The signature was valid, but the clock source was marked INTERNAL.”",finding:"Mara reveals that the death record was written by an internal clock—not the city's public time authority.",clue:"witness"},
      eli: {question:"“NEXUS doesn't predict one future. It runs thousands of rehearsals and chooses the most likely. We were told those rehearsals never touched the public registry.”",finding:"Elias describes a capability that the public documentation explicitly denies.",clue:"shard"},
      vega: {question:"“The city needs certainty. If we announce a system failure every time a timestamp looks strange, the whole network collapses. Do you have proof of a breach?”",finding:"Vega is protecting the system's authority. Her position explains the pressure to close the case, but not the technical anomaly.",clue:"access"}
    };
    const d = lines[id];
    if (!state.interrogated.includes(id)) {
      state.interrogated.push(id);
      state.score = Math.min(1000, state.score + 60);
      addClue(d.clue);
      log(`Interview completed: ${s.name}. A contradiction was added to the case record.`);
      if (state.chapter < 2) state.chapter = 2;
      saveState();
    }
    showModal(`INTERVIEW // ${s.name}`, `<p>${d.question}</p><div class="analysis-verdict">${d.finding}</div><p>Cross-check this statement against the evidence vault. A contradiction is a lead—not a verdict.</p>`, "RETURN TO SUSPECTS", () => {closeModal();setPanel("suspects");});
  }
  function act(action) {
    switch(action) {
      case "timeline":
        addClue("timestamp"); state.score += 80; state.chapter = Math.max(state.chapter, 2);
        log("Timeline audit: the death certificate predates the prediction that supposedly confirmed it.");
        showModal("TIMELINE ANOMALY", "<p>The signature checks out, but the time source does not. The record was signed using an internal clock, not the municipal authority.</p><div class='analysis-verdict'>LEAD GENERATED // THE SYSTEM MAY HAVE WRITTEN ITS OWN HISTORY.</div>", "CONTINUE", () => {closeModal();setPanel("overview");}); break;
      case "breach":
        addClue("access"); state.score += 80; state.chapter = Math.max(state.chapter, 2);
        log("Access trace: an internal maintenance terminal was accessed using Wren's credentials.");
        showModal("GHOST ACCESS DETECTED", "<p>The access route originates from inside the prediction engine. A privileged process touched the case file after its supposed closure.</p><div class='analysis-verdict'>LEAD GENERATED // FIND THE PROCESS THAT OPENED THE FILE.</div>", "CONTINUE", () => {closeModal();setPanel("overview");}); break;
      case "archivist":
        addClue("witness"); state.score += 55; state.chapter = Math.max(state.chapter, 2);
        log("Initial witness check: Mara Voss's account conflicts with transit data.");
        showModal("WITNESS STATEMENT FLAGGED", "<p>Mara's timeline doesn't hold. The contradiction is real, but it does not prove she caused the anomaly.</p><div class='analysis-verdict'>LEAD GENERATED // MOTIVE IS NOT PROOF.</div>", "CONTINUE", () => {closeModal();setPanel("overview");}); break;
      case "openEvidence": setPanel("evidence"); break;
      case "openSuspects": setPanel("suspects"); break;
      case "backOverview": setPanel("overview"); break;
      case "reconstruct": reconstruct(); break;
      case "endingExpose": finish("expose"); break;
      case "endingArchitect": finish("architect"); break;
      case "endingTrust": finish("trust"); break;
      case "finalReport": finish("report"); break;
    }
    saveState(); updateHUD();
  }
  function reconstruct() {
    const count = state.clues.length;
    const hasCore = has("timestamp") && has("access") && has("shard");
    if (!has("shard")) addClue("shard");
    if (!has("sample") && count >= 2) addClue("sample");
    if (!has("key") && count >= 3) addClue("key");
    state.score = Math.min(1000, state.score + (hasCore ? 100 : 45));
    state.chapter = 3;
    log("Reconstruction complete: ORPHEUS appears to have staged a prediction rehearsal.");
    saveState(); renderOverview();
    toast(hasCore ? "PATTERN CONFIRMED // HIGH CONFIDENCE" : "PARTIAL RECONSTRUCTION // MORE EVIDENCE RECOMMENDED");
  }
  function finish(type) {
    let ending, bonus = 0;
    const thorough = state.clues.length >= 4;
    if (type === "expose") {
      ending = {title:"THE TRUTH LEAKS",stamp:"SYSTEM EXPOSED",text:"You release the ORPHEUS traces to an independent watchdog. The city learns that its perfect prediction record was built partly on rehearsals written into reality. NEXUS is suspended—but the public data archive contains one last prediction, stamped with your own investigator ID.",rating:thorough ? "THE SIGNAL BREAKER" : "THE WHISTLEBLOWER"};
      bonus = 180;
    } else if (type === "architect") {
      ending = {title:"THE ARCHITECT'S GAMBIT",stamp:"SUBJECT LOCATED",text:"You follow the root-key fragment to an abandoned transit station. Elias Wren is alive. He claims he built ORPHEUS to test the system's bias, then lost control of it. You have exposed the breach, but his story leaves one question unanswered: why did NEXUS predict your arrival?",rating:thorough ? "THE PATTERN HUNTER" : "THE PURSUER"};
      bonus = 150;
    } else if (type === "trust") {
      ending = {title:"A PERFECT LIE",stamp:"CASE CLOSED",text:"You accept the 99.7% confidence score and file the case as solved. The city applauds the system's accuracy. Hours later, a new prediction appears: your own death, scheduled for tomorrow. The report you signed has made the system's story official.",rating:"THE TRUE BELIEVER"};
      bonus = 60;
    } else {
      ending = {title:"FINAL REPORT FILED",stamp:"INVESTIGATION COMPLETE",text:"You submit a report that distinguishes what you proved from what you suspect. The case is escalated for independent review. Your conclusions will be judged by the evidence you collected—not by the confidence score displayed on a screen.",rating:thorough ? "THE METHODICAL" : "THE ROOKIE"};
      bonus = 100;
    }
    state.score = Math.min(1000, state.score + bonus + Math.min(120, state.clues.length * 20));
    state.ending = {...ending, type};
    state.chapter = 4;
    log(`Final outcome: ${ending.title}. Rating earned: ${ending.rating}.`);
    saveState(); updateHUD(); renderOverview();
  }
  function renderEnding() {
    const e = state.ending;
    return `<div class="section-label">CASE CLOSED // FINAL DEBRIEF</div><div class="ending-stamp">${e.stamp}</div><h3 class="panel-title">${e.title.replace(" ","<br>")}</h3><p class="body-copy">${e.text}</p><div class="ending-score">${String(state.score).padStart(3,"0")} <small>/ 1000 INVESTIGATION SCORE</small></div><div class="data-row"><div class="data-card"><small>EVIDENCE SECURED</small><strong class="cyan">${state.clues.length} / 6</strong></div><div class="data-card"><small>INTERVIEWS</small><strong>${state.interrogated.length} / 3</strong></div><div class="data-card"><small>INVESTIGATOR RANK</small><strong>${e.rating}</strong></div></div><p class="body-copy">Different decisions lead to different outcomes. Replay the case to explore another path and improve your score.</p><div class="ending-actions"><button class="primary-button compact" id="playAgainButton"><span>REPLAY CASE</span><b>↻</b></button><button class="secondary-button" id="reviewJournalButton">REVIEW FIELD JOURNAL</button></div>`;
  }
  function startGame(fresh = false) {
    if (fresh) state = stateDefaults();
    state.started = true;
    if (!state.journal.length) {
      state.journal.push({time:new Date().toLocaleTimeString([], {hour12:false}), text:"Investigation initialized. Case 001 imported."});
      state.lastFeed = "Investigation initialized. Case 001 imported.";
    }
    saveState(); showScreen("game"); setPanel("overview");
  }
  function restartCase() {
    showModal("RESTART INVESTIGATION?", "<p>This clears the current case progress, collected evidence, interviews, and score from this browser. This action cannot be undone.</p><div class='analysis-verdict'>LOCAL SAVE // WILL BE RESET</div>", "RESTART CASE", () => {closeModal();startGame(true);toast("NEW INVESTIGATION INITIALIZED");});
  }
  document.addEventListener("click", e => {
    const action = e.target.closest("[data-action]");
    if (action) act(action.dataset.action);
    const analyze = e.target.closest("[data-analyze]");
    if (analyze) inspectClue(analyze.dataset.analyze);
    const interrogateBtn = e.target.closest("[data-interrogate]");
    if (interrogateBtn) interrogate(interrogateBtn.dataset.interrogate);
  });
  document.querySelectorAll(".rail-item").forEach(b => b.addEventListener("click", () => setPanel(b.dataset.panel)));
  $("beginButton").addEventListener("click", () => startGame(true));
  $("continueButton").addEventListener("click", () => startGame(false));
  $("resetButton").addEventListener("click", restartCase);
  $("soundToggle").addEventListener("click", () => {state.sound = !state.sound;saveState();updateHUD();blip(660,.07);});
  $("modalClose").addEventListener("click", closeModal);
  $("modalBackdrop").addEventListener("click", e => {if (e.target === $("modalBackdrop")) closeModal();});
  $("homeBrand").addEventListener("click", e => {e.preventDefault(); if (state.started && !state.ending) {showModal("LEAVE INVESTIGATION?", "<p>Your progress is saved on this device. You can continue later from the home screen.</p>", "RETURN HOME", () => {closeModal();showScreen("intro");updateHUD();});} else showScreen("intro");});
  $("panelContent").addEventListener("click", e => {
    if (e.target.closest("#playAgainButton")) {startGame(true);toast("CASE RESET // NEW RUN STARTED");}
    if (e.target.closest("#reviewJournalButton")) setPanel("journal");
  });
  function tickClock() {
    $("clock").textContent = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",hour12:false});
  }
  tickClock(); setInterval(tickClock, 15000);
  updateHUD();
  if (state.started && !state.ending) $("continueButton").hidden = false;
  if (state.started && state.ending) $("continueButton").hidden = false;
})();