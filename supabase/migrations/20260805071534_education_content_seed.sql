insert into public.education_categories (slug, title, description, tint, sort_order) values
('pain-crises', 'Pain & Crises', 'How to recognize, respond to, and recover from a crisis.', 'burgundyTint', 1),
('everyday-levers', 'Everyday Levers', $q$Small daily habits — hydration, sleep, movement — that add up.$q$, 'orangeTint', 2),
('know-your-body', 'Know Your Body', $q$Learn your personal patterns and what tends to set them off.$q$, 'darkBurgundyTint', 3),
('using-hemo', 'Getting the Most from Hemo', $q$How Hemo's features fit into managing your day-to-day care.$q$, 'dustyRoseTint', 4);

insert into public.education_articles (topic, category, sort_order, kicker, title, read_time, intro, sections, callout, is_premium, published) values
(
  'pain', 'pain-crises', 1, 'PAIN & CRISES', $q$Managing pain during a crisis$q$, 4,
  $q$A pain crisis can come on fast and feel overwhelming, but you're not starting from zero. Having a simple plan for the first hour — before the pain peaks — can make the rest of the episode easier to ride out.$q$,
  $q$[
    {"heading": "What's actually happening", "body": "During a crisis, sickle-shaped red blood cells get stuck in small blood vessels, slowing or blocking blood flow to the surrounding tissue. That's what produces the deep, aching pain — often in your back, chest, joints, or limbs. It isn't in your head, and it isn't something you can simply push through by ignoring it."},
    {"heading": "First steps at home", "body": "In the early stages, small comfort measures can take the edge off and sometimes slow things down before they escalate:", "bullets": ["Apply warmth — a heating pad or warm bath — to the affected area; avoid ice, which can worsen sickling", "Rest in a position that takes pressure off the painful area rather than pushing through activity", "Start sipping water steadily; dehydration makes sickling more likely", "Take your prescribed pain medication early, at the first sign of a crisis, rather than waiting to see if it passes"]},
    {"heading": "Pain relief basics", "body": "Most people have a step-up plan agreed with their care team — often starting with an over-the-counter or prescribed oral medication, moving to stronger options if pain isn't controlled within the expected window. Stick to the plan you've agreed rather than experimenting with timing or doses on the fly, and keep a rough note of what you've taken and when, so you (or whoever helps you) can answer that question quickly if things escalate."},
    {"heading": "Pacing your recovery", "body": "Once the worst of the pain eases, resist the urge to jump straight back into a full day. Reintroduce activity gradually over a day or two, keep fluids up, and prioritise sleep — recovery is when your body does most of the repair work, and rushing it is a common reason crises seem to recur close together."}
  ]$q$::jsonb,
  $q${"title": "When to get help", "body": "Call your care team or emergency services if you notice chest pain, trouble breathing, a fever over 38°C (100.4°F), sudden weakness or numbness on one side, or a painful erection lasting more than a few hours (priapism). These can signal a complication that needs urgent attention, not just a pain crisis."}$q$::jsonb,
  false, false
),
(
  'hydration', 'everyday-levers', 1, 'HYDRATION', $q$Why hydration matters in SCD$q$, 3,
  $q$Water is one of the simplest, most within-your-control tools you have against sickling. Even mild dehydration changes how your blood behaves — which is why hydration shows up so often as a lever in your logs.$q$,
  $q$[
    {"heading": "How dehydration triggers sickling", "body": "When you're low on fluids, your blood plasma becomes more concentrated. That makes red blood cells more likely to take on the rigid, sickle shape and get stuck in smaller vessels — which is exactly the mechanism behind a pain crisis. Staying ahead of thirst, rather than reacting to it, keeps that concentration effect from creeping up on you."},
    {"heading": "How much to aim for", "body": "There's no single number that fits everyone, but a common starting goal is around 8 cups (roughly 2 litres) a day, adjusted upward in hot weather, during illness, or after exercise when you lose more fluid through sweat. Your care team may have given you a more specific target — that one takes priority over any general guideline."},
    {"heading": "Making it stick day-to-day", "body": "The habit matters more than any single glass. A few small changes tend to make the biggest difference:", "bullets": ["Keep a bottle somewhere you'll actually see it — desk, bag, bedside table", "Front-load your intake earlier in the day so you're not catching up in the evening", "Lean on water-rich foods like fruit, soup, and vegetables alongside what you drink", "Go easy on alcohol and heavy caffeine, both of which increase fluid loss"]}
  ]$q$::jsonb,
  $q${"title": "Signs to act on", "body": "Dark urine, a dry mouth, dizziness when standing, or a headache that won't shift are all early signs you're behind on fluids — worth addressing right away with steady sipping. If dehydration is severe (very little urine, extreme dizziness, confusion) or coincides with a pain crisis, contact your care team or emergency services rather than trying to catch up alone."}$q$::jsonb,
  false, false
),
(
  'sleep', 'everyday-levers', 2, 'REST & RECOVERY', $q$Sleep and sickle cell$q$, 3,
  $q$Sleep isn't just downtime — it's when your body does a lot of its repair work. A rough night here and there is normal, but a pattern of short or broken sleep tends to show up in your logs right before a harder day.$q$,
  $q$[
    {"heading": "Why short nights precede hard days", "body": "Poor sleep adds physical stress at exactly the moment your body could use less of it. Less rest means less recovery time for the small, everyday strain your body is already managing, which is part of why a stretch of bad nights so often lines up with a rougher patch of symptoms a day or two later."},
    {"heading": "Building a wind-down", "body": "You don't need a complicated routine — just something consistent enough that your body learns to recognise it as the signal to slow down: dimming lights an hour before bed, putting the phone somewhere else in the room, and keeping a roughly steady bedtime even on weekends."},
    {"heading": "When pain disrupts sleep", "body": "If joint or body pain is what's keeping you up, the fix isn't always more willpower at bedtime — it's addressing the pain itself earlier in the evening, using whatever positioning or warmth measures usually help, so you're not trying to fall asleep while still uncomfortable."}
  ]$q$::jsonb,
  $q${"title": "Worth raising with your care team", "body": "If poor sleep becomes a persistent pattern rather than an occasional bad night — especially alongside snoring, gasping, or daytime exhaustion that doesn't improve — mention it at your next appointment. It's a common and treatable issue in SCD, not something to just live with."}$q$::jsonb,
  false, false
),
(
  'triggers', 'know-your-body', 1, 'KNOW YOUR TRIGGERS', $q$Getting to know your triggers$q$, 3,
  $q$Two people with SCD can have completely different trigger lists. Learning yours — patiently, over time — is one of the most useful things logging can do for you.$q$,
  $q$[
    {"heading": "Common triggers", "body": "The usual suspects show up again and again across the SCD community, even if not everyone reacts to all of them: cold temperatures, dehydration, emotional or physical stress, overexertion, and infections or illness. None of these guarantee a crisis, but each one raises the odds."},
    {"heading": "Why triggers differ per person", "body": "Your body's threshold for each of these is your own — shaped by your specific SCD type, your baseline hydration and fitness, and plenty of things that are simply individual. That's exactly why a generic list only gets you so far, and why your own history matters more than anyone else's."},
    {"heading": "How logging reveals yours", "body": "A single bad day rarely tells you much. A pattern across weeks or months does. Logging consistently — even on the good days — is what lets Hemo (and you) start noticing which specific conditions tend to show up before your symptoms do."}
  ]$q$::jsonb,
  $q${"title": "Act early when triggers stack", "body": "A cold snap on a day you're already behind on water and short on sleep is a very different risk than any one of those alone. When you notice several known triggers lining up on the same day, treat it as a cue to double down on rest, fluids, and warmth before symptoms start rather than after."}$q$::jsonb,
  false, false
),
(
  'movement', 'everyday-levers', 3, 'MOVEMENT', $q$Moving safely with SCD$q$, 3,
  $q$Staying still isn't automatically safer — gentle, regular movement supports circulation and general wellbeing. The key is choosing the right kind and pace, and knowing when to ease off.$q$,
  $q$[
    {"heading": "Why gentle movement helps", "body": "Light activity keeps blood flowing well and supports joint health and mood, all of which play a part in day-to-day symptom management. The goal isn't intensity — it's consistency at a level your body can comfortably sustain."},
    {"heading": "Safest activities to start with", "body": "Low-impact options tend to be the most forgiving place to start:", "bullets": ["Walking at a comfortable, conversational pace", "Swimming or gentle movement in warm water", "Stretching or light yoga to keep joints mobile", "Easy, short cycling sessions on flat ground"]},
    {"heading": "Listening to your body", "body": "Warm up gradually, avoid pushing through fatigue, and keep water close by before, during, and after — exercise increases fluid loss, and starting or ending dehydrated raises your risk. If something feels off, easing back is the safer default, not a setback."}
  ]$q$::jsonb,
  $q${"title": "Stop at the first sign", "body": "Pause and rest immediately if you notice pain, dizziness, or shortness of breath during activity. Pushing through these signals is not the same as building endurance — it's a common way a gentle session turns into a harder day."}$q$::jsonb,
  false, false
),
(
  'hemo-insights', 'using-hemo', 1, 'INSIGHTS', $q$Valuing the Insights$q$, 3,
  $q$Insights turns weeks of logging into something you can actually use — not a diagnosis, but a mirror held up to your own data. Here's what it's really showing you, and how to get more out of it.$q$,
  $q$[
    {"heading": "What Insights actually shows you", "body": "Every pattern in Insights is built from things you've logged yourself — pain, hydration, sleep, mood, triggers. When Hemo notices two of those move together often enough to be worth mentioning (like pain tending to be higher after short-sleep nights), it surfaces that as a pattern row, with the actual data behind it shown right there as evidence, not just a claim."},
    {"heading": "Observations, not conclusions", "body": "A pattern row will always read like \"your data shows X\" rather than \"X causes Y.\" That's deliberate — Hemo isn't diagnosing you or telling you what to do about it. It's pointing at something real in your own history so you can decide what it means, ideally with your care team."},
    {"heading": "Why some rows say \"still watching\"", "body": "Patterns need enough data to be meaningful — a single rough day doesn't make a trend. A row that says it's still watching just means Hemo hasn't seen enough logged days yet to say something with confidence. Keep logging consistently, even on good days, and it fills in on its own."}
  ]$q$::jsonb,
  $q${"title": "Bring it to your next appointment", "body": "The weekly and monthly recap is built to be shared — it's a quick way to show your care team what's actually been happening between visits, in your own words and your own data, instead of trying to remember it from memory."}$q$::jsonb,
  false, false
),
(
  'hemo-wearables', 'using-hemo', 2, 'SMART WATCH', $q$Tracking with a smart watch$q$, 3,
  $q$Connecting Apple Health or Health Connect lets Hemo fill in the metrics you'd otherwise have to remember to log by hand — heart rate, sleep, steps — straight from your watch or phone.$q$,
  $q$[
    {"heading": "Why connect a wearable", "body": "Pain, mood, and hydration are things only you can report — but heart rate, sleep duration, and step count are things your watch already tracks passively. Connecting it means those metrics show up in your trends automatically, so your logs cover more ground without more typing."},
    {"heading": "What syncs and what doesn't", "body": "Once connected, Hemo pulls in your recent history and keeps syncing going forward. Exactly which metrics are available depends on your device and platform — not every watch reports every metric. The manual side of logging (pain, mood, symptoms, triggers) stays manual either way, since those aren't things a sensor can measure."},
    {"heading": "Turning it on", "body": "Head to Settings → Apple Health (iOS) or Health Connect (Android) and grant the permissions when prompted. You can review exactly what's connected, and disconnect at any time, from that same screen."}
  ]$q$::jsonb,
  $q${"title": "Your data, your control", "body": "Wearable data syncs directly from Apple Health or Health Connect and is used only to enrich your own trends inside Hemo. You can disconnect at any time from Settings."}$q$::jsonb,
  false, false
),
(
  'hemo-pain-status', 'using-hemo', 3, 'PAIN STATUS', $q$What is Pain Status$q$, 2,
  $q$Pain status is Hemo's snapshot of how you're doing right now, built from the pain level you log each day. It's simple by design — a number and a color, so you can track it at a glance and see how it moves over time.$q$,
  $q$[
    {"heading": "Rating your pain", "body": "When you log symptoms, you rate pain from 0 (no pain) to 10 (worst possible) using the pain orb — a simple, breathing visual that responds as you drag. You can add where it's located and any other symptoms alongside it, but the 0–10 score is what drives your pain status."},
    {"heading": "The color scale", "body": "Your score maps to a color, from green (low) through yellow and orange to red and deep red (high) — the same scale used throughout Hemo's charts, so a glance at a color tells you roughly where a day landed without reading a number."},
    {"heading": "How it becomes a trend", "body": "Each day's score feeds into your 7-day and monthly pain charts on the Track tab, so you can see whether things are trending up, down, or holding steady — and it's one of the inputs Insights uses to build pattern rows."}
  ]$q$::jsonb,
  $q${"title": "A conversation starter, not a diagnosis", "body": "Pain status reflects what you reported, nothing more — it's meant to make it easier to describe your pain history to your care team, not to replace their assessment."}$q$::jsonb,
  false, false
),
(
  'hemo-adherence', 'using-hemo', 4, 'ADHERENCE', $q$Know Your Medication Adherence$q$, 2,
  $q$Adherence tracking shows you, plainly, how consistently you've been taking each medication — a number that's easy to lose track of when you're managing more than one.$q$,
  $q$[
    {"heading": "What adherence tracking shows", "body": "Each medication's detail page has an Adherence section with your percentage taken and doses missed, shown as a bar chart you can page through by day, week, month, six months, or year. It's built from the doses you've marked as taken, so the more consistently you log, the more accurate the picture."},
    {"heading": "Setting it up", "body": "Add medications in the Care Hub with their name, dosage, and frequency — up to three during onboarding, and as many as you need afterward. Each one gets its own adherence history from the day you add it."},
    {"heading": "Reminders that fit your routine", "body": "Medication reminders tie into your check-in time and notification settings, so a prompt to mark a dose taken shows up around when you'd actually expect to take it, not on a generic schedule."}
  ]$q$::jsonb,
  $q${"title": "Talk to your care team about changes", "body": "Adherence trends are for your own awareness and for conversations with your care team — never adjust, skip, or stop a medication based on what you see here without talking to your prescriber first."}$q$::jsonb,
  false, false
),
(
  'hemo-community', 'using-hemo', 5, 'COMMUNITY', $q$Finding Your People in Community$q$, 2,
  $q$Sickle cell can be an isolating condition to live with — the pain is real but often invisible, and most people you meet day-to-day won't have any frame of reference for it. Community is Hemo's space to change that.$q$,
  $q$[
    {"heading": "Why community matters in SCD", "body": "Connecting with others who actually live with SCD — not just people who've read about it — tends to help in ways clinical care alone can't: feeling less alone on a hard day, picking up a coping trick from someone who's tried it, or just being understood without having to explain everything from scratch."},
    {"heading": "What you'll find in Community", "body": "Posts, polls, and comments from other Hemo users, organized into Popular, Recent, and Following feeds, plus categories you can follow for topics you care about. You can like, comment, save posts for later, and share your own experience whenever you're ready to."},
    {"heading": "A respectful space", "body": "Community is peer support, not medical advice — what works for one person's SCD may not apply to yours, and posts here don't replace your care team. You're always in control of what you share, and you can save or hide posts to keep your feed feeling right for you."}
  ]$q$::jsonb,
  $q${"title": "You decide what to share", "body": "Post as much or as little as you're comfortable with — Community works whether you're actively sharing your story or just reading what others have gone through."}$q$::jsonb,
  false, false
);
;
