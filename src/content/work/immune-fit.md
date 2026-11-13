---
title: immune.fit
blurb: Pacing for athletes with autoimmune conditions
year: 2026
role: Builder
tags: [AI, Health, Builder]

# immune.fit's own homepage hero, captured from the site at 1280×720 with the
# body copy and buttons hidden: the eyebrow, the headline and the phone mock,
# in the site's own fonts and sizes. Doubles as the project page's lead image.
thumbnail: ../../assets/work/immune-fit.png

# The marketing homepage.
link: https://www.immune.fit/

featured: false
order: 6
draft: false
---

immune.fit is a free web app for athletes living with autoimmune and chronic
conditions. The goal is what I call the active-life sweet spot: training enough
to get stronger without setting off a flare. It brings symptoms, energy,
medications and activity into one place and lines them up against what your
wearables already know.

It runs on two streams of data. The first is what you tell it: a quick check-in
by voice or text, symptom severity on a 0–10 scale, energy, medications, and how
hard a workout felt. The second is what your devices already record: sleep
stages, resting heart rate, HRV, steps and workouts from Apple Health, Garmin,
Oura and Whoop, synced through my own instance of Open Wearables, an open-source
health-data API.

The hard part is getting four devices to agree. A first sync can send hundreds
of updates a minute, so each one is verified and folded into a single pending
sync per person, which a background job works through. A daily catch-up covers
anything a dropped update missed. Each reading is filed under the day it happened
in your own time zone and de-duplicated: a nightly summary beats an all-day
average, and when two devices report the same metric, a set preference order
picks one so nothing double-counts.

The check-in is a conversation. The companion runs on Claude, with Deepgram
handling speech in and out, so voice mode works hands-free. Before it replies, it
reads a short summary of your past seven days: symptoms, energy, activity,
medications, and a few device metrics like HRV and sleep score. It asks one
question at a time and keeps answers to a few sentences. It doesn't give medical
advice, and it points to 911 or 988 when it should.

To check the architecture from the outside, I had Devin read the codebase and
write a wiki: 29 pages with diagrams, from the sync queue to voice mode.
[Read the immune.fit wiki](https://github.com/jarrettheflin/immune-fit-Devin-Wiki).

It's also personal. After I came down with spinal arthritis, doctors told me I
would never run again. I believed them for three years. But through
conversations with, and data from, hundreds of other AS patients, and by tracking
what actually moved my symptoms, I learned how and when to train to stay strong
and get more done. These days I'm back on the road bike, rowing, and even running
up to five miles a day.
