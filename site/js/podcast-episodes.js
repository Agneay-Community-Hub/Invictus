/* ===========================================================
   "Last Light from Voyager" (podcast.html): one episode for each of
   Voyager's 11 science investigations, each told by the instrument
   itself, in the order they went quiet. Facts and switch-off dates
   come from NASA's Voyager status page (science.nasa.gov, updated
   2026) and NASA Voyager blog posts from 2026.
   Speakers: N = the instrument narrating, V = Voyager, T = the flight
   team (made-up engineers), K = a kid's question. Sound cues in
   lines: {sfx: "static" | "beep" | "click" | "sweep" | "hum" | "jingle" | "boom" | "wind"}.
   =========================================================== */
const PODCAST = {
  title: "Last Light from Voyager",
  blurb: "Voyager 1 and 2 left Earth in 1977. One by one, their instruments are being switched off to save power. In each episode, a different instrument tells you the one thing only it could do, and how its last day came.",
  episodes: [
    { id: "pps", short: "PPS", name: "The Photopolarimeter", part: "platform", color: "#c9a7ff",
      status: { v1: "Off · Jan 29, 1980 (stopped working well)", v2: "Off · Apr 3, 1991 (stopped working well)" },
      unique: "A small telescope that could tell how light had been bent and scattered, to work out what clouds and rings are made of.",
      lines: [
        ["N", "", { sfx: "jingle" }],
        ["N", "Hi. I'm the Photopolarimeter. Most people just call me PPS, which is easier to say."],
        ["N", "I'm a little telescope, about as wide as a dinner plate, sitting on Voyager's moving platform with the cameras."],
        ["K", "What does a photopolarimeter actually do?"],
        ["N", "Good question! When sunlight bounces off clouds or the bits of ice in a ring, it gets twisted in a special way. That's called polarisation."],
        ["N", "Sunglasses that cut out glare use the same trick. I measured that twist in eight different colours, from ultraviolet to red."],
        ["N", "From the twist, scientists could work out how big the drops in Jupiter's clouds were, and what Saturn's rings are made of."],
        ["V", "PPS was meant to help us understand those far-off worlds."],
        ["N", "But I had trouble early. My parts started to wear out on the long trip."],
        ["T", "PPS readings are getting worse. We'll have to switch it off.", { sfx: "static" }],
        ["N", "On Voyager 1, that happened on January 29th, 1980. I was the very first instrument to go quiet.", { sfx: "click" }],
        ["N", "My twin on Voyager 2 kept going until 1991. So in a way, I got to see Saturn through my sister's eyes."],
        ["N", "Being first to stop doesn't mean I didn't matter. Every instrument here was a team. Next time, you'll meet the cameras. They took a picture of you."]
      ],
      challenge: { q: "What did PPS measure?", options: ["How light was twisted by clouds and rings", "How loud space is", "The temperature of the Sun"], a: 0 },
      try: ["voyager.html", "Scroll out to where Voyager is now"] },

    { id: "iss", short: "ISS", name: "The Cameras", part: "platform", color: "#ffb347",
      status: { v1: "Off · Feb 14, 1990", v2: "Off · Oct 10 and Dec 5, 1989" },
      unique: "Two cameras, a wide-angle and a zoom, each with a wheel of eight colour filters. Their last pictures were of home.",
      lines: [
        ["N", "", { sfx: "jingle" }],
        ["N", "Hello! We're the Imaging Science System. Two cameras: one wide-angle, one zoom, side by side."],
        ["N", "Each of us has a little wheel with eight colour filters. Click, click, click. That's how we made colour pictures."],
        ["K", "Did you take pictures of Jupiter?"],
        ["N", "Thousands! Swirling storms, volcanoes erupting on its moon Io, and Saturn's rings up close."],
        ["V", "No one had ever seen those worlds so clearly."],
        ["N", "By 1990 our planet visits were over. Voyager 1 was heading out of the solar system for good."],
        ["T", "Before we switch the cameras off, let's turn around. One last look back.", { sfx: "static" }],
        ["N", "So on February 14th, 1990, Valentine's Day, we turned around and took a family portrait of the planets."],
        ["N", "In one of those pictures, Earth is a single tiny blue dot, smaller than a pixel, floating in a beam of sunlight."],
        ["N", "Everyone you know was in that dot. That picture became famous as the Pale Blue Dot."],
        ["N", "Later that same day, we were switched off to save power and memory. We've been dark ever since.", { sfx: "click" }],
        ["N", "Our last ever picture was of home. We think that's a pretty good last picture."]
      ],
      challenge: { q: "What was the last thing Voyager 1's cameras took pictures of?", options: ["Jupiter's storms", "The planets, including Earth as a tiny dot", "Saturn's rings"], a: 1 },
      try: ["library.html#photos", "See Voyager's photos"] },

    { id: "iris", short: "IRIS", name: "The Heat Detector", part: "platform", color: "#ff8a5c",
      status: { v1: "Off · Jun 3, 1998", v2: "Off · Feb 1, 2007" },
      unique: "It measured heat you can't see, to take the temperature of planets and sniff out what gases were there.",
      lines: [
        ["N", "", { sfx: "jingle" }],
        ["N", "I'm IRIS. My full name is the Infrared Interferometer Spectrometer and Radiometer. Even I can't say it fast."],
        ["N", "I see infrared light. That's heat. Your eyes can't see it, but you can feel it from a warm cup of cocoa."],
        ["K", "So you were like a thermometer for planets?"],
        ["N", "Exactly. I could take a planet's temperature from millions of kilometres away."],
        ["N", "And I could do more. Different gases give off heat in different patterns, like fingerprints. I read those fingerprints."],
        ["V", "IRIS told us what the air on Jupiter and Saturn was made of, and how cold it was."],
        ["N", "Cold is right. Out there, everything is freezing. Even me, after a while."],
        ["T", "Power's getting tight. IRIS has done its job. Time to let it rest.", { sfx: "static" }],
        ["N", "On Voyager 1 I was switched off on June 3rd, 1998. My twin on Voyager 2 lasted until 2007.", { sfx: "click" }],
        ["N", "Funny thing: I spent my life measuring heat. Now my power goes to keeping Voyager's other parts warm."]
      ],
      challenge: { q: "What kind of light did IRIS see?", options: ["Ultraviolet", "Infrared, which is heat", "X-rays"], a: 1 },
      try: ["glossary.html", "Look up space words"] },

    { id: "pls", short: "PLS", name: "Plasma Science", part: "boom", color: "#7fd4ff",
      status: { v1: "Off · Feb 1, 2007 (stopped working well)", v2: "Off · Sep 26, 2024" },
      unique: "Four detectors that caught the slow particles of the solar wind: three pointing at the Sun, one looking sideways.",
      lines: [
        ["N", "", { sfx: "jingle" }],
        ["N", "Hey there. I'm Plasma Science, PLS for short."],
        ["N", "The Sun doesn't just shine. It also blows. A stream of tiny charged particles called the solar wind rushes out in every direction."],
        ["K", "Wind in space? Can you feel it?"],
        ["N", "I can! I have four detectors. Three point straight at the Sun to catch the wind coming at us."],
        ["N", "The fourth looks out sideways, to study the bubbles of magnetism around planets."],
        ["V", "PLS felt the Sun's breath all the way out past the planets."],
        ["N", "On Voyager 1, I started working poorly after the planet visits, and I was switched off on February 1st, 2007.", { sfx: "click" }],
        ["N", "But my twin on Voyager 2 kept going much longer, all the way out into interstellar space."],
        ["T", "We need to save power on Voyager 2. Plasma Science is next.", { sfx: "static" }],
        ["N", "She was switched off on September 26th, 2024. Forty-seven years of feeling the wind."],
        ["N", "Out where we are now, the Sun's wind has finally run out. It's quieter than you can imagine."]
      ],
      challenge: { q: "What is the solar wind?", options: ["Air blowing in space", "A stream of tiny charged particles from the Sun", "Light from the Sun"], a: 1 },
      try: ["tracker.html", "Watch the Voyagers move, live"] },

    { id: "pra", short: "PRA", name: "Planetary Radio Astronomy", part: "antennas", color: "#5ee6a8",
      status: { v1: "Off · Jan 15, 2008", v2: "Off · Feb 21, 2008" },
      unique: "It shared two long antennas, sticking out like a V, to listen to the radio signals that planets give off.",
      lines: [
        ["N", "", { sfx: "jingle" }],
        ["N", "Psst. Can you hear that? I'm Planetary Radio Astronomy. PRA. I listen."],
        ["N", "Planets give off radio waves, just like a radio station, only nobody is talking. It's the planet itself."],
        ["N", "", { sfx: "sweep" }],
        ["K", "How do you hear radio without ears?"],
        ["N", "With two long antennas that stick out from Voyager in a V shape. I share them with my friend, the Plasma Wave instrument."],
        ["N", "With them I picked up the crackle of giant planets: radio storms from Jupiter, and signals that told scientists how fast Saturn spins."],
        ["V", "Voyager also caught radio signals from lightning on other planets."],
        ["N", "I listened for more than thirty years."],
        ["T", "PRA's work at the planets is long done. Let's save its power for the instruments still finding new things.", { sfx: "static" }],
        ["N", "On Voyager 1, I went quiet on January 15th, 2008, and my twin a month later.", { sfx: "click" }],
        ["N", "But our antennas are still out there. My friend still uses them to listen. Stay tuned for that episode."]
      ],
      challenge: { q: "What did PRA listen to?", options: ["Music from Earth", "Radio waves given off by planets", "Aliens talking"], a: 1 },
      try: ["library.html#sounds", "Hear real sounds from space missions"] },

    { id: "uvs", short: "UVS", name: "The Ultraviolet Spectrometer", part: "platform", color: "#c9a7ff",
      status: { v1: "Off · Apr 19, 2016", v2: "Off · Nov 12, 1998" },
      unique: "It split ultraviolet light into colours to find out which atoms are floating around planets and in space.",
      lines: [
        ["N", "", { sfx: "jingle" }],
        ["N", "Hello, I'm UVS, the Ultraviolet Spectrometer."],
        ["N", "Ultraviolet is the kind of light that gives you a sunburn. You can't see it, but I can."],
        ["N", "I split it up into its colours, like a prism making a rainbow. Every kind of atom leaves its own pattern of lines."],
        ["K", "So you could tell what things are made of, just by looking?"],
        ["N", "Yes! I found out what the thin outer air of planets is made of, and looked for gases around moons and rings."],
        ["N", "On Voyager 1, I stayed on long after the planets, looking out at the space between stars."],
        ["V", "UVS was one of the longest-working instruments on Voyager 1."],
        ["T", "Every watt counts now. Thank you, UVS.", { sfx: "static" }],
        ["N", "I was switched off on April 19th, 2016, after almost thirty-nine years.", { sfx: "click" }],
        ["N", "My twin on Voyager 2 had stopped back in 1998. I got to keep looking for eighteen more years. Lucky me."]
      ],
      challenge: { q: "Which light gives you a sunburn?", options: ["Ultraviolet", "Infrared", "Radio"], a: 0 },
      try: ["timeline.html?year=2016", "See 2016 on the timeline"] },

    { id: "crs", short: "CRS", name: "The Cosmic Ray Subsystem", part: "boom", color: "#ff7a7a",
      status: { v1: "Off · Feb 25, 2025", v2: "Still on" },
      unique: "The most sensitive particle detector on Voyager. The fastest particles in the universe fly straight through it, and it counts them.",
      lines: [
        ["N", "", { sfx: "jingle" }],
        ["N", "Hi! I'm CRS, the Cosmic Ray Subsystem. Some people call me the cosmic ray telescope."],
        ["N", "Cosmic rays aren't really rays. They're tiny bits of atoms, shot across the galaxy faster than anything you've ever seen, by exploding stars long ago."],
        ["K", "Do they hurt?"],
        ["N", "Not me! They zoom right through me, and as they go, they leave marks. I count the marks to learn how strong and how fast they were."],
        ["N", "Of Voyager's three particle detectors, I'm the most sensitive."],
        ["V", "As we left the Sun's bubble, CRS felt more and more of the galaxy's cosmic rays reaching us."],
        ["N", "That's right. On August 25th, 2012, Voyager 1 became the first spacecraft ever to leave the Sun's bubble and enter interstellar space."],
        ["N", "For thirteen more years I counted particles from the stars."],
        ["T", "Voyager 1 is losing about four watts every year. We have to make a hard choice.", { sfx: "static" }],
        ["N", "On February 25th, 2025, I was switched off on Voyager 1.", { sfx: "click" }],
        ["N", "But my twin on Voyager 2 is still on, still counting. So I'm only half asleep."]
      ],
      challenge: { q: "What does CRS count?", options: ["Stars", "Cosmic rays: tiny, very fast bits of atoms", "Planets"], a: 1 },
      try: ["voyager.html", "Scroll to the edge of the Sun's bubble"] },

    { id: "lecp", short: "LECP", name: "Low-Energy Charged Particles", part: "boom", color: "#ffd23f",
      status: { v1: "Off · Apr 17, 2026", v2: "Off · Mar 24, 2025" },
      unique: "It sits on a little turntable. A tiny motor spins it round and round so it can catch particles from every direction.",
      lines: [
        ["N", "", { sfx: "jingle" }],
        ["N", "Wheee! Sorry. I'm LECP, Low-Energy Charged Particles. I spin."],
        ["N", "", { sfx: "hum" }],
        ["N", "I sit on a little turntable. A tiny motor turns me round and round, so I can catch particles coming from every direction."],
        ["K", "Doesn't the motor get tired after all those years?"],
        ["N", "You'd think so! But it kept turning for nearly fifty years, out in the freezing cold."],
        ["N", "Beyond the Sun's bubble, I found pressure fronts: places where particles crowd together and thin out, like waves."],
        ["V", "LECP helped us map the strange space beyond the Sun's bubble."],
        ["N", "My twin on Voyager 2 was switched off first, on March 24th, 2025."],
        ["T", "Voyager 1 had a power dip in February. To keep the spacecraft safe, LECP is next.", { sfx: "static" }],
        ["N", "On April 17th, 2026, I was switched off on Voyager 1.", { sfx: "click" }],
        ["N", "But here's my secret: they left my little motor running, using just half a watt."],
        ["N", "That way, if they ever have power to spare, I could wake up and spin again. I'm not gone. I'm napping."]
      ],
      challenge: { q: "What makes LECP special?", options: ["It takes photos", "It spins on a turntable to look in every direction", "It's the biggest dish"], a: 1 },
      try: ["probe.html", "Design your own probe"] },

    { id: "pws", short: "PWS", name: "The Plasma Wave Subsystem", part: "antennas", color: "#3fb6ff",
      status: { v1: "Still on", v2: "Still on" },
      unique: "It uses the long V-shaped antennas to listen to waves rippling through the thin gas of space. Still working on both Voyagers.",
      lines: [
        ["N", "", { sfx: "jingle" }],
        ["N", "Hello, listeners. I'm PWS, the Plasma Wave Subsystem. And I'm still on."],
        ["N", "Space isn't totally empty. There's a very thin gas of charged particles called plasma. When it gets disturbed, waves ripple through it."],
        ["N", "", { sfx: "sweep" }],
        ["K", "Is that what it sounds like?"],
        ["N", "Sort of! I don't hear sound like you do. I feel these waves with the two long antennas Voyager uses like a pair of ears."],
        ["N", "Scientists can turn my measurements into sound. That's how you heard that whistle."],
        ["N", "When the Sun has a big outburst, the waves reach me months later, and the gas around me starts to ring like a bell."],
        ["V", "By listening to the ringing, scientists could tell how thick the gas is out here, between the stars."],
        ["T", "Voyager 1 has just two instruments left. PWS is one of them.", { sfx: "static" }],
        ["N", "So I keep listening. I'm one of Voyager 1's last two working instruments."],
        ["N", "One day I'll go quiet too. But not today."]
      ],
      challenge: { q: "How does PWS 'hear' space?", options: ["With a microphone", "It feels waves in space plasma with its antennas", "It doesn't, it only takes photos"], a: 1 },
      try: ["tracker.html", "See where Voyager 1 is right now"] },

    { id: "mag", short: "MAG", name: "The Magnetometer", part: "mag", color: "#9fe0ff",
      status: { v1: "Still on", v2: "Still on" },
      unique: "It measures magnetic fields from the end of a long boom, far away from the spacecraft's own electronics.",
      lines: [
        ["N", "", { sfx: "jingle" }],
        ["N", "Greetings. I'm MAG, the magnetometer. I feel magnetism."],
        ["N", "You know how a compass needle always points north? That's Earth's magnetism. The Sun has magnetism too, and it reaches far, far out."],
        ["K", "Why are you on a stick so far from the rest of Voyager?"],
        ["N", "Ha! Because Voyager's own electronics make their own little magnetic fields. To feel the faint magnetism of space, I need to be far away from all that noise."],
        ["N", "So I sit at the end of a long boom, like holding your phone away from you to get a better signal."],
        ["N", "My main job is to measure how the Sun's magnetism changes the farther from the Sun you go."],
        ["V", "MAG has been measuring since 1977, and it still is."],
        ["T", "MAG and PWS are the last two on Voyager 1. We're doing everything we can to keep them running.", { sfx: "static" }],
        ["N", "In September 2026, the team turned off three devices on Voyager 1 and swapped in lower-power ones. They call it the Big Bang."],
        ["N", "Without that, another instrument would have needed to be switched off as soon as summer 2027."],
        ["N", "So for now, I'm still feeling the magnetism of space. Out here, it's the galaxy's magnetism, not the Sun's."]
      ],
      challenge: { q: "Why is MAG on a long boom?", options: ["To look taller", "To stay away from Voyager's own magnetic noise", "To catch the solar wind"], a: 1 },
      try: ["compare.html?a=voyager1&b=voyager2", "Compare Voyager 1 and 2"] },

    { id: "rss", short: "RSS", name: "Radio Science", part: "dish", color: "#e9eef7",
      status: { v1: "The radio still talks to Earth", v2: "The radio still talks to Earth" },
      unique: "Not a separate box: it used Voyager's own radio. Signals passing through a planet's air on their way to Earth told scientists about that air.",
      lines: [
        ["N", "", { sfx: "jingle" }],
        ["N", "Hello, Earth. This is Radio Science. I'm a bit different from the others."],
        ["N", "I'm not a separate instrument. I'm Voyager's own radio, the big dish that talks to Earth, used as a science tool."],
        ["K", "How can a radio do science?"],
        ["N", "When Voyager flew behind a planet or a moon, my signal passed through its air on the way to Earth."],
        ["N", "The air bent and faded my signal a little. By measuring how much, scientists learned how thick and how warm that air was."],
        ["V", "Every message from Voyager still travels home on this radio."],
        ["N", "Right now, my voice takes almost a whole day to reach you. On November 18th, 2026, Voyager 1 is one light-day from Earth."],
        ["N", "That means a message I send arrives a full day later. And a reply takes another day to come back."],
        ["T", "We can still hear you, Voyager. Faintly, but we can hear you.", { sfx: "beep" }],
        ["N", "When the last instrument goes quiet, I'll still be here, sending home my own health reports for as long as there's power."],
        ["N", "And when the power is finally gone, Voyager will keep flying, silent, carrying the Golden Record out among the stars."],
        ["N", "Thanks for listening. This has been Last Light from Voyager. Over and out.", { sfx: "static" }]
      ],
      challenge: { q: "On November 18th, 2026, how long does a radio message from Voyager 1 take to reach Earth?", options: ["About one minute", "About one day", "About one year"], a: 1 },
      try: ["voyager.html", "Scroll all the way to Voyager 1"] }
  ]
};
